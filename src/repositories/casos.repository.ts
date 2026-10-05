import { db } from '../prisma/db.js';
import type { ResultType } from '@prisma/orm-postgres/components/runtime';
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

// Filtros de GET /api/casos (HU-02 y HU-03).
export interface FiltrosCaso {
  solicitanteId?: number;
  agenteId?: number;
  abiertos?: boolean;
  sinAgente?: boolean;
  orden: ListarCasosQuery['orden'];
}

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
  async buscarCategoriaActivaDeArea(
    categoriaId: number,
    areaId: number,
  ): Promise<{ id: number } | null> {
    return db.orm.public.Categoria.where({
      id: categoriaId,
      activa: true,
      areaId,
    }).first();
  }
}
