import { db } from '../prisma/db.js';
import type { Models } from '../prisma/contract.js';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';

export type CategoriaRecord = Scalars<Models.public_Categoria>;

export interface FiltrosCategoria {
  areaId?: number;
  activa?: boolean;
}

export class CategoriasRepository {
  async listar(filtros?: FiltrosCategoria): Promise<CategoriaRecord[]> {
    let query = db.orm.public.Categoria.select(
      'id',
      'areaId',
      'nombre',
      'descripcion',
      'activa',
    ).orderBy(categoria => categoria.id.asc());

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
}
