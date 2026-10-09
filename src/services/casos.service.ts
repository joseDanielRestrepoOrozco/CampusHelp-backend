import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../errors/app-error.js';
import { validarTransicion, type EstadoCaso } from '../domain/estados.js';
import { aCasoDto, type CasoDto } from '../dto/caso.dto.js';
import { aAtencionDto, type AtencionDto } from '../dto/atencion.dto.js';
import type {
  CreateCasoInput,
  ListarCasosQuery,
  ReclasificarCasoInput,
  RegistrarAtencionInput,
  ValidarCasoInput,
} from '../schemas/caso.schema.js';
import type { CambiosClasificacion, CasosRepository } from '../repositories/casos.repository.js';
import type { AtencionesRepository } from '../repositories/atenciones.repository.js';
import { aHistorialDto, type HistorialDto } from '../dto/historial.dto.js';
import type { HistorialRepository } from '../repositories/historial.repository.js';
import type {
  UsuarioAutenticado,
  UsuariosRepository,
} from '../repositories/usuarios.repository.js';

// Capa de servicio: aquí viven las reglas de negocio del registro de casos,
// no en el controlador ni en el repositorio.
export class CasosService {
  constructor(
    private readonly casos: CasosRepository,
    private readonly historial: HistorialRepository,
    private readonly usuarios: UsuariosRepository,
    private readonly atenciones: AtencionesRepository,
  ) {}

  // HU-01: registrar incidente o solicitud.
  async registrarCaso(usuario: UsuarioAutenticado, input: CreateCasoInput): Promise<CasoDto> {
    // Solo los solicitantes registran casos.
    if (usuario.rol !== 'SOLICITANTE') {
      throw new ForbiddenError('ROL_NO_PERMITIDO', 'Solo los solicitantes pueden registrar casos');
    }

    // RN-03: la categoría debe existir, estar activa y pertenecer al área enviada.
    const categoria = await this.casos.buscarCategoriaActivaDeArea(input.categoriaId, input.areaId);
    if (!categoria) {
      throw new ConflictError(
        'CATEGORIA_INVALIDA',
        'La categoría no existe, está inactiva o no pertenece al área indicada',
      );
    }

    // El área no se guarda en el caso: sale de la categoría (RN-03).
    const { areaId: _areaId, ...datosCaso } = input;

    const casoId = await this.casos.crearCaso(datosCaso, usuario.id);

    const caso = await this.casos.buscarPorId(casoId);
    if (!caso) {
      throw new AppError(500, 'ERROR_INTERNO', 'El caso recién creado no se pudo leer');
    }

    return aCasoDto(caso);
  }

  // HU-02 / HU-03 / HU-09: consultar, filtrar y bandeja de trabajo.
  async listarCasos(usuario: UsuarioAutenticado, query: ListarCasosQuery): Promise<CasoDto[]> {
    // RN-20: un solicitante solo ve sus propios casos, aunque pida los de otro.
    // Los demás roles ven todos y pueden filtrar por solicitante. El resto de
    // filtros (HU-09) se aplica encima, así que el solicitante filtra sus casos.
    const solicitanteId = usuario.rol === 'SOLICITANTE' ? usuario.id : query.solicitanteId;

    const casos = await this.casos.listar({ ...query, solicitanteId });
    return casos.map(aCasoDto);
  }

  // HU-05: cambiar el estado del caso.
  async cambiarEstado(
    usuario: UsuarioAutenticado,
    casoId: number,
    estadoNuevo: EstadoCaso,
  ): Promise<CasoDto> {
    // Solo el agente mueve el caso por esta ruta; el cierre es del validador (#33).
    if (usuario.rol !== 'AGENTE') {
      throw new ForbiddenError(
        'ROL_NO_PERMITIDO',
        'Solo los agentes pueden cambiar el estado de un caso',
      );
    }

    const caso = await this.casos.buscarPorId(casoId);
    if (!caso) {
      throw new NotFoundError('El caso no existe');
    }

    // RN-09, RN-10 y RN-14: la tabla de transiciones vive en src/domain/estados.ts.
    // RN-13: si el caso va de En atención a En validación, se comprueba antes que
    // exista una solución vigente (atención posterior a la última devolución).
    let tieneAtencionVigente: boolean | undefined;
    if (caso.estado === 'EN_ATENCION' && estadoNuevo === 'EN_VALIDACION') {
      const atencion = await this.atenciones.atencionVigente(casoId);
      const devolucion = await this.historial.ultimaDevolucion(casoId);
      tieneAtencionVigente =
        atencion !== null &&
        (devolucion === null || new Date(atencion.fecha) > new Date(devolucion.fecha));
    }

    validarTransicion(caso, estadoNuevo, 'manual', { tieneAtencionVigente });

    await this.casos.cambiarEstado(casoId, caso.estado, estadoNuevo, usuario.id);

    // Dentro de la transacción solo cambia `estado`: el resto de columnas y las
    // relaciones ya se leyeron, así que no hace falta volver a consultar el caso.
    return aCasoDto({ ...caso, estado: estadoNuevo });
  }

  // HU-05: el agente corrige tipo, prioridad o categoría (clasificar y priorizar).
  // Orden de errores del contrato: 404 → 403 → 409.
  async reclasificarCaso(
    usuario: UsuarioAutenticado,
    casoId: number,
    input: ReclasificarCasoInput,
  ): Promise<CasoDto> {
    const caso = await this.casos.buscarPorId(casoId);
    if (!caso) {
      throw new NotFoundError('El caso no existe');
    }

    if (usuario.rol !== 'AGENTE') {
      throw new ForbiddenError('ROL_NO_PERMITIDO', 'Solo los agentes pueden reclasificar un caso');
    }

    // RN-10: cerrada es un estado final.
    if (caso.estado === 'CERRADA') {
      throw new ConflictError('CASO_CERRADO', 'El caso está cerrado y no admite cambios');
    }

    // RN-08: solo se reclasifica mientras el caso está en Pendiente o En análisis.
    if (!ESTADOS_RECLASIFICABLES.has(caso.estado)) {
      throw new ConflictError(
        'ESTADO_NO_PERMITE_OPERACION',
        'Solo se puede reclasificar un caso en Pendiente o En análisis',
      );
    }

    const { categoria: categoriaActual } = caso;
    if (!categoriaActual?.area) {
      throw new AppError(500, 'ERROR_INTERNO', 'El caso no tiene su categoría y área completas');
    }

    const cambios: CambiosClasificacion = {};
    const descripcion: string[] = [];

    if (input.tipo !== undefined && input.tipo !== caso.tipo) {
      cambios.tipo = input.tipo;
      descripcion.push(`tipo: ${caso.tipo} → ${input.tipo}`);
    }

    if (input.prioridad !== undefined && input.prioridad !== caso.prioridad) {
      cambios.prioridad = input.prioridad;
      descripcion.push(`prioridad: ${caso.prioridad} → ${input.prioridad}`);
    }

    if (input.categoriaId !== undefined && input.areaId !== undefined) {
      // Enviar la categoría y el área que el caso ya tiene no es un cambio, aunque
      // la categoría se haya desactivado después: no se valida ni se registra.
      const mismaCategoria =
        input.categoriaId === categoriaActual.id && input.areaId === categoriaActual.area.id;

      if (!mismaCategoria) {
        // RN-03: la nueva categoría debe existir, estar activa y ser del área enviada.
        const nueva = await this.casos.buscarCategoriaActivaDeArea(input.categoriaId, input.areaId);
        if (!nueva?.area) {
          throw new ConflictError(
            'CATEGORIA_INVALIDA',
            'La categoría no existe, está inactiva o no pertenece al área indicada',
          );
        }

        cambios.categoriaId = nueva.id;
        descripcion.push(
          `categoría: ${categoriaActual.nombre} (${categoriaActual.area.nombre}) → ` +
            `${nueva.nombre} (${nueva.area.nombre})`,
        );
      }
    }

    // Los valores enviados son los actuales: 200 sin evento de historial.
    if (descripcion.length === 0) {
      return aCasoDto(caso);
    }

    await this.casos.reclasificar(casoId, caso.estado, cambios, usuario.id, descripcion.join('; '));

    // La categoría (y con ella el área) puede haber cambiado: se vuelve a leer.
    const actualizado = await this.casos.buscarPorId(casoId);
    if (!actualizado) {
      throw new AppError(500, 'ERROR_INTERNO', 'El caso reclasificado no se pudo leer');
    }

    return aCasoDto(actualizado);
  }

  // HU-04: asignar o reasignar el agente responsable. Un agente puede asignarse
  // a sí mismo o asignar a otro agente. Orden de errores del contrato: 404 → 403 → 409.
  async asignarCaso(
    usuario: UsuarioAutenticado,
    casoId: number,
    agenteId: number,
  ): Promise<CasoDto> {
    const caso = await this.casos.buscarPorId(casoId);
    if (!caso) {
      throw new NotFoundError('El caso no existe');
    }

    if (usuario.rol !== 'AGENTE') {
      throw new ForbiddenError('ROL_NO_PERMITIDO', 'Solo los agentes pueden asignar un caso');
    }

    // RN-10: cerrada es un estado final.
    if (caso.estado === 'CERRADA') {
      throw new ConflictError('CASO_CERRADO', 'El caso está cerrado y no admite cambios');
    }

    // RN-19: solo se asigna o reasigna en Pendiente o En análisis.
    if (!ESTADOS_ASIGNABLES.has(caso.estado)) {
      throw new ConflictError(
        'ESTADO_NO_PERMITE_OPERACION',
        'Solo se puede asignar un caso en Pendiente o En análisis',
      );
    }

    // RN-18: solo usuarios con rol Agente y activos. Un id inexistente cae aquí.
    const agente = await this.usuarios.buscarActivoPorId(agenteId);
    if (!agente || agente.rol !== 'AGENTE') {
      throw new ConflictError('AGENTE_INVALIDO', 'El agente indicado no es un agente activo');
    }

    // Ya está asignado a ese agente: 200 sin evento y sin cambiar la fecha.
    if (caso.agenteId === agente.id) {
      return aCasoDto(caso);
    }

    const comentario = caso.agente
      ? `Reasignado de ${caso.agente.nombre} a ${agente.nombre}`
      : `Asignado a ${agente.nombre}`;

    await this.casos.asignar(casoId, caso.estado, agente.id, usuario.id, comentario);

    // El agente y la fecha de asignación cambiaron: se vuelve a leer el caso.
    const actualizado = await this.casos.buscarPorId(casoId);
    if (!actualizado) {
      throw new AppError(500, 'ERROR_INTERNO', 'El caso asignado no se pudo leer');
    }

    return aCasoDto(actualizado);
  }

  // HU-06: el agente asignado documenta el diagnóstico y la solución. Orden de
  // errores del contrato: 400 (esquema) → 404 → 403 → 409.
  async registrarAtencion(
    usuario: UsuarioAutenticado,
    casoId: number,
    input: RegistrarAtencionInput,
  ): Promise<AtencionDto> {
    const caso = await this.casos.buscarPorId(casoId);
    if (!caso) {
      throw new NotFoundError('El caso no existe');
    }

    if (usuario.rol !== 'AGENTE') {
      throw new ForbiddenError(
        'ROL_NO_PERMITIDO',
        'Solo los agentes pueden registrar la atención de un caso',
      );
    }

    // RN-12: solo el agente asignado documenta la atención.
    if (caso.agenteId !== usuario.id) {
      throw new ForbiddenError(
        'NO_ES_AGENTE_ASIGNADO',
        'Solo el agente asignado al caso puede registrar la atención',
      );
    }

    // RN-10: cerrada es un estado final.
    if (caso.estado === 'CERRADA') {
      throw new ConflictError('CASO_CERRADO', 'El caso está cerrado y no admite cambios');
    }

    // RN-12: la atención solo se registra cuando el caso está En atención.
    if (caso.estado !== 'EN_ATENCION') {
      throw new ConflictError(
        'ESTADO_NO_PERMITE_OPERACION',
        'Solo se puede registrar una atención en un caso En atención',
      );
    }

    const atencionId = await this.atenciones.registrarAtencion(
      casoId,
      usuario.id,
      input.diagnostico,
      input.solucion,
      caso.estado,
    );

    const atencion = await this.atenciones.buscarPorId(atencionId);
    if (!atencion) {
      throw new AppError(500, 'ERROR_INTERNO', 'La atención recién creada no se pudo leer');
    }

    return aAtencionDto(atencion);
  }

  // HU-07: el validador aprueba (cierra) o devuelve la solución. Orden de errores
  // del contrato: 400 (esquema) → 404 → 403 → 409.
  async validarCaso(
    usuario: UsuarioAutenticado,
    casoId: number,
    input: ValidarCasoInput,
  ): Promise<CasoDto> {
    const caso = await this.casos.buscarPorId(casoId);
    if (!caso) {
      throw new NotFoundError('El caso no existe');
    }

    if (usuario.rol !== 'VALIDADOR') {
      throw new ForbiddenError('ROL_NO_PERMITIDO', 'Solo los validadores pueden validar un caso');
    }

    // RN-10: cerrada es un estado final.
    if (caso.estado === 'CERRADA') {
      throw new ConflictError('CASO_CERRADO', 'El caso está cerrado y no admite cambios');
    }

    if (caso.estado !== 'EN_VALIDACION') {
      throw new ConflictError(
        'ESTADO_NO_PERMITE_OPERACION',
        'Solo se puede validar un caso En validación',
      );
    }

    // RN-16: quien registró la atención vigente no puede validarla.
    const atencion = await this.atenciones.atencionVigente(casoId);
    if (atencion && atencion.agenteId === usuario.id) {
      throw new ConflictError(
        'VALIDADOR_ES_AGENTE',
        'El validador no puede ser quien registró la atención del caso',
      );
    }

    // RN-14 y RN-15: la tabla de transiciones vive en src/domain/estados.ts.
    const estadoNuevo: EstadoCaso = input.aprobado ? 'CERRADA' : 'EN_ATENCION';
    validarTransicion(caso, estadoNuevo, 'validacion');

    await this.casos.validar(casoId, input.aprobado, input.comentario, usuario.id);

    // El estado, la fecha de cierre y el historial cambiaron: se vuelve a leer.
    const actualizado = await this.casos.buscarPorId(casoId);
    if (!actualizado) {
      throw new AppError(500, 'ERROR_INTERNO', 'El caso validado no se pudo leer');
    }

    return aCasoDto(actualizado);
  }

  // HU-08: historial de un caso. AGENTE, VALIDADOR y ADMINISTRADOR ven el de
  // cualquiera; SOLICITANTE solo el de sus casos (RN-20).
  async verHistorial(usuario: UsuarioAutenticado, casoId: number): Promise<HistorialDto[]> {
    const caso = await this.casos.buscarPorId(casoId);
    if (!caso) {
      throw new NotFoundError('El caso no existe');
    }

    // RN-20: el solicitante solo consulta sus propios casos. Se comprueba después
    // del 404 a propósito: al revés, un solicitante usaría el 403 para saber qué
    // ids existen.
    if (usuario.rol === 'SOLICITANTE' && caso.solicitanteId !== usuario.id) {
      throw new ForbiddenError(
        'CASO_AJENO',
        'No puedes consultar el historial de un caso que no es tuyo',
      );
    }

    const eventos = await this.historial.listarPorCaso(casoId);
    return eventos.map(aHistorialDto);
  }
}

// RN-08: estados en los que el agente puede corregir la clasificación.
const ESTADOS_RECLASIFICABLES: ReadonlySet<EstadoCaso> = new Set(['PENDIENTE', 'EN_ANALISIS']);

// RN-19: estados en los que se puede asignar o reasignar el caso.
const ESTADOS_ASIGNABLES: ReadonlySet<EstadoCaso> = new Set(['PENDIENTE', 'EN_ANALISIS']);
