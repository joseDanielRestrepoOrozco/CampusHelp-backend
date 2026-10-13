import { db } from '../prisma/db.js';
import type { Models } from '../prisma/contract.js';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import { ConflictError } from '../errors/app-error.js';

export type CategoriaRecord = Scalars<Models.public_Categoria>;

export interface FiltrosCategoria {
  areaId?: number;
  activa?: boolean;
}

export interface DatosNuevaCategoria {
  areaId: number;
  nombre: string;
  descripcion: string | null;
}

export interface DatosEdicionCategoria {
  nombre: string;
  descripcion: string | null;
}

// `nombre` se compara literal: `%`, `_` y `\` no actúan como comodines de ILIKE.
const patronExacto = (texto: string) => texto.replace(/[\\%_]/g, '\\$&');

// SQLSTATE de Postgres: 23505 = unique_violation, 23503 = foreign_key_violation.
const tieneSqlState = (error: unknown, sqlState: string): boolean => {
  for (let actual = error; typeof actual === 'object' && actual !== null;) {
    if ('sqlState' in actual && actual.sqlState === sqlState) return true;
    actual = 'cause' in actual ? actual.cause : undefined;
  }
  return false;
};

export class CategoriasRepository {
  async listar(filtros?: FiltrosCategoria): Promise<CategoriaRecord[]> {
    let query = db.orm.public.Categoria.select(
      'id',
      'areaId',
      'nombre',
      'descripcion',
      'activa',
    ).orderBy(categoria => categoria.nombre.asc());

    if (filtros?.areaId !== undefined) {
      query = query.where({ areaId: filtros.areaId });
    }

    if (filtros?.activa !== undefined) {
      query = query.where({ activa: filtros.activa });
    }

    return query.all();
  }

  async buscarPorId(id: number): Promise<CategoriaRecord | null> {
    return db.orm.public.Categoria.where({ id }).first();
  }

  // Casos por categoría (HU-11), en una sola consulta. Las categorías sin casos
  // no aparecen en el resultado: quien lo consulte debe asumir 0.
  async contarCasosPorCategoria(categoriaIds: number[]): Promise<Map<number, number>> {
    if (categoriaIds.length === 0) return new Map();

    const filas = await db.orm.public.Caso.where(caso => caso.categoriaId.in(categoriaIds))
      .groupBy('categoriaId')
      .aggregate(aggregate => ({ total: aggregate.count() }));

    return new Map(filas.map(fila => [fila.categoriaId, fila.total]));
  }

  async contarCasos(categoriaId: number): Promise<number> {
    return (await this.contarCasosPorCategoria([categoriaId])).get(categoriaId) ?? 0;
  }

  // RN-22: el nombre es único por área sin distinguir mayúsculas. `excluirId`
  // evita que una categoría choque consigo misma al editarla.
  async buscarPorNombreEnArea(
    areaId: number,
    nombre: string,
    excluirId?: number,
  ): Promise<CategoriaRecord | null> {
    let query = db.orm.public.Categoria.where({ areaId }).where(categoria =>
      categoria.nombre.ilike(patronExacto(nombre)),
    );

    if (excluirId !== undefined) {
      query = query.where(categoria => categoria.id.neq(excluirId));
    }

    return query.first();
  }

  // La comprobación previa del servicio no cubre dos peticiones simultáneas con
  // el mismo nombre exacto: la unicidad (area_id, nombre) de la base lo rechaza.
  async crear(datos: DatosNuevaCategoria): Promise<CategoriaRecord> {
    try {
      return await db.orm.public.Categoria.create({ ...datos, activa: true });
    } catch (error) {
      throw traducirDuplicado(error);
    }
  }

  async actualizar(id: number, datos: DatosEdicionCategoria): Promise<CategoriaRecord | null> {
    try {
      return await db.orm.public.Categoria.where({ id }).update(datos);
    } catch (error) {
      throw traducirDuplicado(error);
    }
  }

  async cambiarActiva(id: number, activa: boolean): Promise<CategoriaRecord | null> {
    return db.orm.public.Categoria.where({ id }).update({ activa });
  }

  // La clave foránea de caso.categoria_id protege a quien creó un caso con esta
  // categoría después de la comprobación del servicio.
  async eliminar(id: number): Promise<void> {
    try {
      await db.orm.public.Categoria.where({ id }).delete();
    } catch (error) {
      if (tieneSqlState(error, '23503')) {
        throw new ConflictError(
          'CATEGORIA_CON_CASOS',
          'La categoría tiene casos; desactívala en vez de borrarla',
        );
      }
      throw error;
    }
  }
}

function traducirDuplicado(error: unknown): unknown {
  return tieneSqlState(error, '23505')
    ? new ConflictError('CATEGORIA_DUPLICADA', 'Ya existe una categoría con ese nombre en el área')
    : error;
}
