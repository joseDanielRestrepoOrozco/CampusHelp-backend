import { db } from '../prisma/db.js';
import type { ResultType } from '@prisma/orm-postgres/components/runtime';
import type { CreateCasoInput } from '../schemas/caso.schema.js';
import type { HistorialRepository } from './historial.repository.js';

// Consulta con las relaciones anidadas que exige el DTO (Caso de docs/03-api.md).
const consultaCasoConRelaciones = (id: number) =>
  db.orm.public.Caso.where({ id })
    .include('solicitante', usuario => usuario)
    .include('agente', usuario => usuario)
    .include('categoria', categoria => categoria.include('area', area => area));

export type CasoConRelaciones = ResultType<ReturnType<typeof consultaCasoConRelaciones>>;

// El caso guarda la categoría pero no el área: el área sale de la categoría (RN-03).
export type DatosCaso = Omit<CreateCasoInput, 'areaId'>;

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
