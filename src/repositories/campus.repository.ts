import {
  INITIAL_USUARIOS,
  INITIAL_AREAS,
  INITIAL_CATEGORIAS,
  INITIAL_CASOS,
  INITIAL_ATENCIONES,
  INITIAL_HISTORIAL,
  type Usuario,
  type Area,
  type Categoria,
  type Caso,
  type Atencion,
  type HistorialItem,
} from '../data/seed-data.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../errors/app-error.js';
import type {
  CategoriaQuery,
  CreateCategoriaInput,
  UpdateCategoriaInput,
  CasosQuery,
  CreateCasoInput,
} from '../schemas/campus.schema.js';

export class CampusRepository {
  private usuarios: Usuario[] = [];
  private areas: Area[] = [];
  private categorias: Categoria[] = [];
  private casos: Caso[] = [];
  private atenciones: Atencion[] = [];
  private historial: HistorialItem[] = [];

  constructor() {
    this.resetToSeed();
  }

  resetToSeed(): void {
    this.usuarios = JSON.parse(JSON.stringify(INITIAL_USUARIOS));
    this.areas = JSON.parse(JSON.stringify(INITIAL_AREAS));
    this.categorias = JSON.parse(JSON.stringify(INITIAL_CATEGORIAS));
    this.casos = JSON.parse(JSON.stringify(INITIAL_CASOS));
    this.atenciones = JSON.parse(JSON.stringify(INITIAL_ATENCIONES));
    this.historial = JSON.parse(JSON.stringify(INITIAL_HISTORIAL));
  }

  // --- USUARIOS ---
  findUsuarios(): Usuario[] {
    return this.usuarios;
  }

  findUsuarioById(id: number): Usuario | null {
    return this.usuarios.find(u => u.id === id) ?? null;
  }

  // --- AREAS ---
  findAreas(onlyActive = true): Area[] {
    if (onlyActive) {
      return this.areas.filter(a => a.activa);
    }
    return this.areas;
  }

  findAreaById(id: number): Area | null {
    return this.areas.find(a => a.id === id) ?? null;
  }

  // --- CATEGORIAS ---
  findCategorias(query?: CategoriaQuery): Categoria[] {
    return this.categorias.filter(c => {
      if (query?.areaId !== undefined && c.areaId !== query.areaId) {
        return false;
      }
      if (query?.activa !== undefined && c.activa !== query.activa) {
        return false;
      }
      return true;
    });
  }

  findCategoriaById(id: number): Categoria | null {
    return this.categorias.find(c => c.id === id) ?? null;
  }

  createCategoria(input: CreateCategoriaInput): Categoria {
    const area = this.findAreaById(input.areaId);
    if (!area) {
      throw new ConflictError('CATEGORIA_INVALIDA', 'El área especificada no existe');
    }

    const duplicate = this.categorias.find(
      c =>
        c.areaId === input.areaId &&
        c.nombre.trim().toLowerCase() === input.nombre.trim().toLowerCase(),
    );
    if (duplicate) {
      throw new ConflictError(
        'CATEGORIA_DUPLICADA',
        'Ya existe una categoría con ese nombre en el área',
      );
    }

    const nextId = this.categorias.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const nuevaCategoria: Categoria = {
      id: nextId,
      areaId: input.areaId,
      nombre: input.nombre.trim(),
      descripcion: input.descripcion ? input.descripcion.trim() : null,
      activa: true,
    };

    this.categorias.push(nuevaCategoria);
    return nuevaCategoria;
  }

  updateCategoria(id: number, input: UpdateCategoriaInput): Categoria {
    const categoria = this.findCategoriaById(id);
    if (!categoria) {
      throw new NotFoundError('No existe la categoría solicitada');
    }

    const duplicate = this.categorias.find(
      c =>
        c.id !== id &&
        c.areaId === categoria.areaId &&
        c.nombre.trim().toLowerCase() === input.nombre.trim().toLowerCase(),
    );
    if (duplicate) {
      throw new ConflictError(
        'CATEGORIA_DUPLICADA',
        'Ya existe una categoría con ese nombre en el área',
      );
    }

    categoria.nombre = input.nombre.trim();
    categoria.descripcion =
      input.descripcion !== undefined
        ? input.descripcion
          ? input.descripcion.trim()
          : null
        : categoria.descripcion;

    return categoria;
  }

  setCategoriaActiva(id: number, activa: boolean): Categoria {
    const categoria = this.findCategoriaById(id);
    if (!categoria) {
      throw new NotFoundError('No existe la categoría solicitada');
    }

    categoria.activa = activa;
    return categoria;
  }

  hasCasosCategoria(categoriaId: number): boolean {
    return this.casos.some(caso => {
      // Comparar tanto por nombre como por id de categoria si es accesible
      const cat = this.categorias.find(c => c.id === categoriaId);
      return caso.categoria.id === categoriaId || (cat && caso.categoria.nombre === cat.nombre);
    });
  }

  deleteCategoria(id: number): void {
    const categoria = this.findCategoriaById(id);
    if (!categoria) {
      throw new NotFoundError('No existe la categoría solicitada');
    }

    if (this.hasCasosCategoria(id)) {
      throw new ConflictError(
        'CATEGORIA_CON_CASOS',
        'Se intenta borrar una categoría que tiene casos',
      );
    }

    this.categorias = this.categorias.filter(c => c.id !== id);
  }

  // --- CASOS ---
  findCasos(query: CasosQuery, currentUser: Usuario): Caso[] {
    let result = [...this.casos];

    // Regla RN-20: Si el usuario es SOLICITANTE, el backend ignora solicitanteId y siempre filtra por él
    if (currentUser.rol === 'SOLICITANTE') {
      result = result.filter(c => c.solicitante.id === currentUser.id);
    } else {
      if (query.solicitanteId !== undefined) {
        result = result.filter(c => c.solicitante.id === query.solicitanteId);
      }
    }

    // Filtros de Bandeja de Agente (HU-03)
    if (query.agenteId !== undefined) {
      result = result.filter(c => c.agente?.id === query.agenteId);
    }

    if (query.noCerrados) {
      result = result.filter(c => c.estado !== 'CERRADA');
    }

    if (query.estado) {
      result = result.filter(c => c.estado === query.estado);
    }

    if (query.tipo) {
      result = result.filter(c => c.tipo === query.tipo);
    }

    if (query.areaId !== undefined) {
      const area = this.findAreaById(query.areaId);
      if (area) {
        result = result.filter(c => c.area.id === area.id || c.area.nombre === area.nombre);
      }
    }

    if (query.categoriaId !== undefined) {
      const cat = this.findCategoriaById(query.categoriaId);
      if (cat) {
        result = result.filter(c => c.categoria.id === cat.id || c.categoria.nombre === cat.nombre);
      }
    }

    if (query.prioridad) {
      result = result.filter(c => c.prioridad === query.prioridad);
    }

    if (query.q) {
      const term = query.q.toLowerCase();
      result = result.filter(
        c => c.titulo.toLowerCase().includes(term) || c.descripcion.toLowerCase().includes(term),
      );
    }

    // Ordenamiento (fecha_desc por defecto, prioridad)
    if (query.orden === 'prioridad') {
      const priorityOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3 };
      return result.toSorted((a, b) => {
        const diff = (priorityOrder[a.prioridad] ?? 99) - (priorityOrder[b.prioridad] ?? 99);
        if (diff !== 0) return diff;
        return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
      });
    }

    // fecha_desc por defecto
    return result.toSorted(
      (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime(),
    );
  }

  findCasoById(id: number, currentUser?: Usuario): Caso | null {
    const caso = this.casos.find(c => c.id === id);
    if (!caso) return null;

    if (
      currentUser &&
      currentUser.rol === 'SOLICITANTE' &&
      caso.solicitante.id !== currentUser.id
    ) {
      throw new ForbiddenError('CASO_AJENO', 'Un solicitante intenta ver un caso que no es suyo');
    }

    // Adjuntar atenciones ordenadas de más reciente a más antigua
    const casoAtenciones = this.atenciones
      .filter(a => a.casoId === id)
      .toSorted((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return {
      ...caso,
      atenciones: casoAtenciones,
    };
  }

  createCaso(input: CreateCasoInput, solicitante: Usuario): Caso {
    if (solicitante.rol !== 'SOLICITANTE') {
      throw new ForbiddenError(
        'ROL_NO_PERMITIDO',
        'Solo usuarios con rol SOLICITANTE pueden registrar casos',
      );
    }

    const area = this.findAreaById(input.areaId);
    const categoria = this.findCategoriaById(input.categoriaId);

    if (!area || !categoria || !categoria.activa || categoria.areaId !== area.id) {
      throw new ConflictError(
        'CATEGORIA_INVALIDA',
        'La categoría no existe, está inactiva o no pertenece al área enviada',
      );
    }

    const nextId = this.casos.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const now = new Date().toISOString();

    const nuevoCaso: Caso = {
      id: nextId,
      tipo: input.tipo,
      titulo: input.titulo.trim(),
      descripcion: input.descripcion.trim(),
      prioridad: input.prioridad,
      estado: 'PENDIENTE',
      solicitante: { id: solicitante.id, nombre: solicitante.nombre },
      agente: null,
      categoria: { id: categoria.id, nombre: categoria.nombre },
      area: { id: area.id, nombre: area.nombre },
      fechaCreacion: now,
      fechaAsignacion: null,
      fechaCierre: null,
    };

    this.casos.push(nuevoCaso);

    // Registro de historial: CREACION
    const nextHistorialId = this.historial.reduce((max, h) => Math.max(max, h.id), 0) + 1;
    this.historial.push({
      id: nextHistorialId,
      casoId: nuevoCaso.id,
      evento: 'CREACION',
      estadoAnterior: null,
      estadoNuevo: 'PENDIENTE',
      usuario: { id: solicitante.id, nombre: solicitante.nombre },
      fecha: now,
      comentario: null,
    });

    return nuevoCaso;
  }

  asignarCaso(casoId: number, agenteId: number, currentUser: Usuario): Caso {
    const caso = this.casos.find(c => c.id === casoId);
    if (!caso) {
      throw new NotFoundError('No existe el caso solicitado');
    }

    if (caso.estado === 'CERRADA') {
      throw new ConflictError('CASO_CERRADO', 'Se intenta modificar un caso en CERRADA');
    }

    if (caso.estado === 'EN_VALIDACION') {
      throw new ConflictError(
        'ESTADO_NO_PERMITE_OPERACION',
        'No se puede asignar un caso en validación',
      );
    }

    const agente = this.findUsuarioById(agenteId);
    if (!agente || agente.rol !== 'AGENTE' || !agente.activo) {
      throw new ConflictError(
        'AGENTE_INVALIDO',
        'El agenteId no es un usuario con rol AGENTE activo',
      );
    }

    const now = new Date().toISOString();
    caso.agente = { id: agente.id, nombre: agente.nombre };
    caso.fechaAsignacion = now;

    // Registrar evento de historial
    const nextHistorialId = this.historial.reduce((max, h) => Math.max(max, h.id), 0) + 1;
    this.historial.push({
      id: nextHistorialId,
      casoId: caso.id,
      evento: 'ASIGNACION',
      estadoAnterior: caso.estado,
      estadoNuevo: caso.estado,
      usuario: { id: currentUser.id, nombre: currentUser.nombre },
      fecha: now,
      comentario: `Asignado a ${agente.nombre}`,
    });

    return caso;
  }

  cambiarEstado(
    casoId: number,
    nuevoEstado: 'PENDIENTE' | 'EN_ANALISIS' | 'EN_ATENCION' | 'EN_VALIDACION',
    currentUser: Usuario,
  ): Caso {
    const caso = this.casos.find(c => c.id === casoId);
    if (!caso) {
      throw new NotFoundError('No existe el caso solicitado');
    }

    if (caso.estado === 'CERRADA') {
      throw new ConflictError('CASO_CERRADO', 'Se intenta modificar un caso en CERRADA');
    }

    if (currentUser.rol === 'AGENTE' && caso.agente && caso.agente.id !== currentUser.id) {
      throw new ForbiddenError(
        'NO_ES_AGENTE_ASIGNADO',
        'Un agente distinto al asignado intenta operar el caso',
      );
    }

    if (nuevoEstado === 'EN_ATENCION' && !caso.agente) {
      throw new ConflictError('SIN_AGENTE_ASIGNADO', 'Se intenta pasar a EN_ATENCION sin agente');
    }

    if (nuevoEstado === 'EN_VALIDACION') {
      const atenciones = this.atenciones.filter(a => a.casoId === casoId);
      if (atenciones.length === 0) {
        throw new ConflictError(
          'SIN_SOLUCION',
          'Se intenta pasar a EN_VALIDACION sin atención registrada',
        );
      }
    }

    const estadoAnterior = caso.estado;
    caso.estado = nuevoEstado;
    const now = new Date().toISOString();

    const nextHistorialId = this.historial.reduce((max, h) => Math.max(max, h.id), 0) + 1;
    this.historial.push({
      id: nextHistorialId,
      casoId: caso.id,
      evento: 'CAMBIO_ESTADO',
      estadoAnterior,
      estadoNuevo: nuevoEstado,
      usuario: { id: currentUser.id, nombre: currentUser.nombre },
      fecha: now,
      comentario: null,
    });

    return caso;
  }

  registrarAtencion(
    casoId: number,
    diagnostico: string,
    solucion: string,
    agente: Usuario,
  ): Atencion {
    const caso = this.casos.find(c => c.id === casoId);
    if (!caso) {
      throw new NotFoundError('No existe el caso solicitado');
    }

    if (caso.estado === 'CERRADA') {
      throw new ConflictError('CASO_CERRADO', 'Se intenta modificar un caso en CERRADA');
    }

    if (caso.estado !== 'EN_ATENCION') {
      throw new ConflictError(
        'ESTADO_NO_PERMITE_OPERACION',
        'Solo se puede registrar atención en estado EN_ATENCION',
      );
    }

    if (agente.rol !== 'AGENTE' && agente.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenError('ROL_NO_PERMITIDO', 'Solo un agente puede registrar atención');
    }

    if (agente.rol === 'AGENTE' && caso.agente && caso.agente.id !== agente.id) {
      throw new ForbiddenError(
        'NO_ES_AGENTE_ASIGNADO',
        'Un agente distinto al asignado intenta operar el caso',
      );
    }

    const now = new Date().toISOString();
    const nextAtencionId = this.atenciones.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const nuevaAtencion: Atencion = {
      id: nextAtencionId,
      casoId,
      diagnostico: diagnostico.trim(),
      solucion: solucion.trim(),
      fecha: now,
      agenteId: agente.id,
      agente: { id: agente.id, nombre: agente.nombre },
    };

    this.atenciones.push(nuevaAtencion);

    // Al registrar atención pasa a EN_VALIDACION
    caso.estado = 'EN_VALIDACION';

    const nextHistorialId = this.historial.reduce((max, h) => Math.max(max, h.id), 0) + 1;
    this.historial.push({
      id: nextHistorialId,
      casoId,
      evento: 'ATENCION',
      estadoAnterior: 'EN_ATENCION',
      estadoNuevo: 'EN_VALIDACION',
      usuario: { id: agente.id, nombre: agente.nombre },
      fecha: now,
      comentario: 'Diagnóstico y solución registrados',
    });

    return nuevaAtencion;
  }

  // --- HU-07: VALIDACION ---
  validarCaso(
    casoId: number,
    aprobado: boolean,
    comentario: string | null | undefined,
    validador: Usuario,
  ): Caso {
    if (validador.rol !== 'VALIDADOR' && validador.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenError(
        'ROL_NO_PERMITIDO',
        'Solo un usuario con rol VALIDADOR puede validar casos',
      );
    }

    const caso = this.casos.find(c => c.id === casoId);
    if (!caso) {
      throw new NotFoundError('No existe el caso solicitado');
    }

    if (caso.estado === 'CERRADA') {
      throw new ConflictError('CASO_CERRADO', 'Se intenta modificar un caso en CERRADA');
    }

    if (caso.estado !== 'EN_VALIDACION') {
      throw new ConflictError(
        'ESTADO_NO_PERMITE_OPERACION',
        'Solo se puede validar un caso que esté en estado EN_VALIDACION',
      );
    }

    // Regla VALIDADOR_ES_AGENTE: El validador es quien registró la atención vigente
    const atencionesCaso = this.atenciones
      .filter(a => a.casoId === casoId)
      .toSorted((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const atencionVigente = atencionesCaso[0];
    if (atencionVigente && atencionVigente.agenteId === validador.id) {
      throw new ConflictError(
        'VALIDADOR_ES_AGENTE',
        'El validador es quien registró la atención vigente',
      );
    }

    const now = new Date().toISOString();
    const nextHistorialId = this.historial.reduce((max, h) => Math.max(max, h.id), 0) + 1;

    if (aprobado) {
      // Caso aprobado -> CERRADA
      caso.estado = 'CERRADA';
      caso.fechaCierre = now;

      this.historial.push({
        id: nextHistorialId,
        casoId,
        evento: 'APROBACION',
        estadoAnterior: 'EN_VALIDACION',
        estadoNuevo: 'CERRADA',
        usuario: { id: validador.id, nombre: validador.nombre },
        fecha: now,
        comentario: comentario?.trim() || null,
      });
    } else {
      // Caso devuelto -> EN_ATENCION
      caso.estado = 'EN_ATENCION';

      this.historial.push({
        id: nextHistorialId,
        casoId,
        evento: 'DEVOLUCION',
        estadoAnterior: 'EN_VALIDACION',
        estadoNuevo: 'EN_ATENCION',
        usuario: { id: validador.id, nombre: validador.nombre },
        fecha: now,
        comentario: comentario?.trim() || 'Solución devuelta por el validador',
      });
    }

    return caso;
  }

  // --- HISTORIAL ---
  findHistorialByCasoId(casoId: number, currentUser?: Usuario): HistorialItem[] {
    const caso = this.findCasoById(casoId, currentUser);
    if (!caso) {
      throw new NotFoundError('No existe el caso solicitado');
    }

    return this.historial.filter(h => h.casoId === casoId);
  }

  // --- INDICADORES (HU-10) ---
  getIndicadores(filtros?: { desde?: string; hasta?: string }) {
    let casosFiltrados = [...this.casos];

    if (filtros?.desde) {
      const desdeTime = new Date(filtros.desde).getTime();
      casosFiltrados = casosFiltrados.filter(c => new Date(c.fechaCreacion).getTime() >= desdeTime);
    }
    if (filtros?.hasta) {
      const hastaTime = new Date(filtros.hasta).getTime();
      casosFiltrados = casosFiltrados.filter(c => new Date(c.fechaCreacion).getTime() <= hastaTime);
    }

    const total = casosFiltrados.length;

    const porEstado: Record<string, number> = {
      PENDIENTE: 0,
      EN_ANALISIS: 0,
      EN_ATENCION: 0,
      EN_VALIDACION: 0,
      CERRADA: 0,
    };
    const porTipo: Record<string, number> = {
      INCIDENTE: 0,
      SOLICITUD: 0,
    };
    const porPrioridad: Record<string, number> = {
      P1: 0,
      P2: 0,
      P3: 0,
    };
    const areaMap: Record<string, number> = {};

    let totalHorasAsignacion = 0;
    let countAsignados = 0;

    let totalHorasResolucion = 0;
    let countCerrados = 0;

    for (const c of casosFiltrados) {
      if (porEstado[c.estado] !== undefined) porEstado[c.estado]++;
      if (porTipo[c.tipo] !== undefined) porTipo[c.tipo]++;
      if (porPrioridad[c.prioridad] !== undefined) porPrioridad[c.prioridad]++;

      areaMap[c.area.nombre] = (areaMap[c.area.nombre] ?? 0) + 1;

      if (c.fechaAsignacion) {
        const horas =
          (new Date(c.fechaAsignacion).getTime() - new Date(c.fechaCreacion).getTime()) /
          (1000 * 60 * 60);
        if (horas >= 0) {
          totalHorasAsignacion += horas;
          countAsignados++;
        }
      }

      if (c.fechaCierre) {
        const horas =
          (new Date(c.fechaCierre).getTime() - new Date(c.fechaCreacion).getTime()) /
          (1000 * 60 * 60);
        if (horas >= 0) {
          totalHorasResolucion += horas;
          countCerrados++;
        }
      }
    }

    const porArea = Object.entries(areaMap).map(([area, cantidad]) => ({ area, cantidad }));

    // Devoluciones desde historial
    const devoluciones = this.historial.filter(h => h.evento === 'DEVOLUCION').length;

    return {
      total,
      porEstado,
      porTipo,
      porPrioridad,
      porArea,
      promedioHorasHastaAsignacion:
        countAsignados > 0 ? Number((totalHorasAsignacion / countAsignados).toFixed(1)) : 0,
      promedioHorasResolucion:
        countCerrados > 0 ? Number((totalHorasResolucion / countCerrados).toFixed(1)) : 0,
      devoluciones,
    };
  }
}

export const campusRepository = new CampusRepository();
