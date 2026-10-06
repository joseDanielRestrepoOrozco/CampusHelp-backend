import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../errors/app-error.js';
import { validarTransicion, type EstadoCaso } from '../domain/estados.js';
import { aCasoDto, type CasoDto } from '../dto/caso.dto.js';
import { aHistorialDto, type HistorialDto } from '../dto/historial.dto.js';
import type { CreateCasoInput, ListarCasosQuery } from '../schemas/caso.schema.js';
import type { CasosRepository } from '../repositories/casos.repository.js';
import type { HistorialRepository } from '../repositories/historial.repository.js';
import type { UsuarioAutenticado } from '../repositories/usuarios.repository.js';

// Capa de servicio: aquí viven las reglas de negocio del registro de casos,
// no en el controlador ni en el repositorio.
export class CasosService {
  constructor(
    private readonly casos: CasosRepository,
    private readonly historial: HistorialRepository,
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

  // HU-02 / HU-03: consultar casos y bandeja de trabajo.
  async listarCasos(usuario: UsuarioAutenticado, query: ListarCasosQuery): Promise<CasoDto[]> {
    // RN-20: un solicitante solo ve sus propios casos, aunque pida los de otro.
    // Los demás roles ven todos y pueden filtrar por solicitante.
    const solicitanteId = usuario.rol === 'SOLICITANTE' ? usuario.id : query.solicitanteId;

    const casos = await this.casos.listar({
      solicitanteId,
      agenteId: query.agenteId,
      abiertos: query.abiertos,
      sinAgente: query.sinAgente,
      orden: query.orden,
    });
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
    validarTransicion(caso, estadoNuevo, 'manual');

    await this.casos.cambiarEstado(casoId, caso.estado, estadoNuevo, usuario.id);

    // Dentro de la transacción solo cambia `estado`: el resto de columnas y las
    // relaciones ya se leyeron, así que no hace falta volver a consultar el caso.
    return aCasoDto({ ...caso, estado: estadoNuevo });
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
