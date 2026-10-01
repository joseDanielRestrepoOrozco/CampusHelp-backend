import { db } from '../prisma/db.js';
import type { Models } from '../prisma/contract.js';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';

export type UsuarioAutenticado = Scalars<Models.public_Usuario>;

export class UsuariosRepository {
  async buscarActivoPorId(id: number): Promise<UsuarioAutenticado | null> {
    return db.orm.public.Usuario.where({ id, activo: true }).first();
  }
}
