import { db } from '../prisma/db.js';
import type { ResultType } from '@prisma/orm-postgres/components/runtime';
import type { EstadoCaso } from '../domain/estados.js';
import { ConflictError } from '../errors/app-error.js';
import type { CreateCasoInput, ListarCasosQuery } from '../schemas/caso.schema.js';
import type { HistorialRepository } from './historial.repository.js';

// Casos con las relaciones anidadas que exige el DTO (Caso de docs/03-api.md).
// Se cargan con `include` en la misma consulta, no una consulta por caso.
const casosConRelaciones = () =>
  db.orm.public.Caso.include('solicitante', usuario => usuario)
    .include('agente', usuario => usuario)
    .include('categoria', categoria => categoria.include('area', area => area));

const consultaCasoConRelaciones = (id: number) => casosConRelaciones().where({ id });

export type CasoConRelaciones = ResultType<ReturnType<typeof consultaCasoConRelaciones>>;

// El caso guarda la categoría pero no el área: el área sale de la categoría (RN-03).
export type DatosCaso = Omit<CreateCasoInput, 'areaId'>;

const consultaCategoriaActivaDeArea = (categoriaId: number, areaId: number) =>
  db.orm.public.Categoria.where({ id: categoriaId, activa: true, areaId }).include(
    'area',
    area => area,
  );

export type CategoriaConArea = ResultType<ReturnType<typeof consultaCategoriaActivaDeArea>>;

// Campos que puede cambiar la reclasificación (RN-08). El área no se guarda en
// el caso: sale de la categoría (RN-03).
export interface CambiosClasificacion {
  tipo?: CasoConRelaciones['tipo'];
  prioridad?: CasoConRelaciones['prioridad'];
  categoriaId?: number;
}

// Filtros de GET /api/casos (HU-02, HU-03 y HU-09): los mismos query params ya
// validados, con `solicitanteId` ya decidido por el servicio (RN-20).
export type FiltrosCaso = ListarCasosQuery;

// `q` se busca literal: `%`, `_` y `\` del texto no actúan como comodines de LIKE.
const patronContiene = (texto: string) => `%${texto.replace(/[\\%_]/g, '\\$&')}%`;

// Solo acceso a datos. Las reglas de negocio (rol, categoría) viven en
// CasosService; aquí solo se persiste y se consulta.
export class CasosRepository {
  constructor(private readonly historial: HistorialRepository) {}

  // El caso y su evento de creación se escriben en la misma transacción: si el
  // historial falla, el caso tampoco queda (RN-17).
  async crearCaso(datos: DatosCaso, solicitanteId: number): Promise<number> {
    return db.transaction(async tx => {
      const creado = await tx.orm.public.Caso.create({
        ...datos,
        estado: 'PENDIENTE',
        solicitanteId,
      });

      await this.historial.registrarEvento(tx, {
        casoId: creado.id,
        evento: 'CREACION',
        estadoAnterior: null,
        estadoNuevo: 'PENDIENTE',
        usuarioId: solicitanteId,
        comentario: null,
      });

      return creado.id;
    });
  }

  async buscarPorId(id: number): Promise<CasoConRelaciones | null> {
    return consultaCasoConRelaciones(id).first();
  }

  // El cambio de estado y su evento se escriben en la misma transacción: si el
  // historial falla, el estado tampoco queda (RN-17).
  //
  // El `where` exige que el caso siga en `estadoAnterior`. Dos peticiones
  // simultáneas sobre el mismo caso pasaron la validación con la misma lectura:
  // la segunda no encuentra la fila, no cambia nada y responde 409 en vez de
  // duplicar el evento. `fechaCierre` no se toca: cerrar solo lo hace la
  // validación (#33).
  async cambiarEstado(
    casoId: number,
    estadoAnterior: EstadoCaso,
    estadoNuevo: EstadoCaso,
    usuarioId: number,
  ): Promise<void> {
    await db.transaction(async tx => {
      const actualizado = await tx.orm.public.Caso.where({
        id: casoId,
        estado: estadoAnterior,
      }).update({ estado: estadoNuevo });

      if (!actualizado) {
        throw new ConflictError(
          'TRANSICION_INVALIDA',
          'El caso cambió de estado mientras se procesaba la petición; inténtalo de nuevo',
        );
      }

      await this.historial.registrarEvento(tx, {
        casoId,
        evento: 'CAMBIO_ESTADO',
        estadoAnterior,
        estadoNuevo,
        usuarioId,
      });
    });
  }

  async listar(filtros: FiltrosCaso): Promise<CasoConRelaciones[]> {
    let query = casosConRelaciones();

    if (filtros.solicitanteId !== undefined) {
      query = query.where({ solicitanteId: filtros.solicitanteId });
    }

    if (filtros.sinAgente) {
      query = query.where(caso => caso.agenteId.isNull());
    } else if (filtros.agenteId !== undefined) {
      query = query.where({ agenteId: filtros.agenteId });
    }

    if (filtros.abiertos) {
      query = query.where(caso => caso.estado.neq('CERRADA'));
    }

    const { estado, tipo, prioridad, areaId, categoriaId, q } = filtros;

    if (estado) {
      query = query.where(caso => caso.estado.in(estado));
    }

    if (tipo) {
      query = query.where(caso => caso.tipo.in(tipo));
    }

    if (prioridad) {
      query = query.where(caso => caso.prioridad.in(prioridad));
    }

    // El caso no guarda el área: se filtra por el área de su categoría (RN-03).
    // Si no coincide con `categoriaId`, simplemente no hay resultados.
    if (areaId !== undefined) {
      query = query.where(caso => caso.categoria.some(categoria => categoria.areaId.eq(areaId)));
    }

    if (categoriaId !== undefined) {
      query = query.where({ categoriaId });
    }

    if (q !== undefined) {
      query = query.where(caso => caso.titulo.ilike(patronContiene(q)));
    }

    if (filtros.orden === 'prioridad') {
      // Prioridad: P1 primero, luego P2, luego P3; más antiguos primero para atender lo que más espera (CP-13).
      return query
        .orderBy([
          caso => caso.prioridad.asc(),
          caso => caso.fechaCreacion.asc(),
          caso => caso.id.asc(),
        ])
        .all();
    }

    // fecha_desc: más recientes primero; el id desempata casos con la misma fecha.
    return query.orderBy([caso => caso.fechaCreacion.desc(), caso => caso.id.desc()]).all();
  }

  // RN-03: la categoría debe existir, estar activa y pertenecer al área enviada.
  // Devuelve null para que la regla (y el 409) los aplique la capa de servicio.
  // Trae el área para que la reclasificación pueda describir el cambio.
  async buscarCategoriaActivaDeArea(
    categoriaId: number,
    areaId: number,
  ): Promise<CategoriaConArea | null> {
    return consultaCategoriaActivaDeArea(categoriaId, areaId).first();
  }

  // RN-18 y RN-17: el agente, la fecha de asignación y el evento ASIGNACION se
  // escriben en la misma transacción. El `where` exige que el caso siga en
  // `estadoActual`: si otra petición lo movió a un estado que ya no admite
  // asignar (RN-19), no se cambia nada y se responde 409.
  async asignar(
    casoId: number,
    estadoActual: EstadoCaso,
    agenteId: number,
    usuarioId: number,
    comentario: string,
  ): Promise<void> {
    await db.transaction(async tx => {
      const actualizado = await tx.orm.public.Caso.where({
        id: casoId,
        estado: estadoActual,
      }).update({ agenteId, fechaAsignacion: new Date().toISOString() });

      if (!actualizado) {
        throw new ConflictError(
          'ESTADO_NO_PERMITE_OPERACION',
          'El caso cambió de estado mientras se procesaba la petición; inténtalo de nuevo',
        );
      }

      await this.historial.registrarEvento(tx, {
        casoId,
        evento: 'ASIGNACION',
        estadoAnterior: estadoActual,
        estadoNuevo: estadoActual,
        usuarioId,
        comentario,
      });
    });
  }

  // RN-08 y RN-17: los nuevos valores y el evento RECLASIFICACION se escriben en
  // la misma transacción. El `where` exige que el caso siga en `estadoActual`:
  // si otra petición lo movió a un estado que ya no admite reclasificar, no se
  // cambia nada y se responde 409.
  async reclasificar(
    casoId: number,
    estadoActual: EstadoCaso,
    cambios: CambiosClasificacion,
    usuarioId: number,
    comentario: string,
  ): Promise<void> {
    await db.transaction(async tx => {
      const actualizado = await tx.orm.public.Caso.where({
        id: casoId,
        estado: estadoActual,
      }).update(cambios);

      if (!actualizado) {
        throw new ConflictError(
          'ESTADO_NO_PERMITE_OPERACION',
          'El caso cambió de estado mientras se procesaba la petición; inténtalo de nuevo',
        );
      }

      await this.historial.registrarEvento(tx, {
        casoId,
        evento: 'RECLASIFICACION',
        estadoAnterior: estadoActual,
        estadoNuevo: estadoActual,
        usuarioId,
        comentario,
      });
    });
  }
}
