import { db } from '../prisma/db.js';
import type { Models } from '../prisma/contract.js';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';

export type AreaRecord = Scalars<Models.public_Area>;

export class AreasRepository {
  async listarActivas(): Promise<AreaRecord[]> {
    return db.orm.public.Area.select('id', 'nombre', 'descripcion', 'activa')
      .where({ activa: true })
      .orderBy(area => area.id.asc())
      .all();
  }

  async buscarPorId(id: number): Promise<AreaRecord | null> {
    return db.orm.public.Area.where({ id }).first();
  }
}
