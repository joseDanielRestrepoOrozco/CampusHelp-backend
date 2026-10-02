import { db } from '../prisma/db.js';
import type { Models } from '../prisma/contract.js';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';

export type UsuarioAutenticado = Scalars<Models.public_Usuario>;

export interface FiltrosUsuario {
  activo?: boolean;
  rol?: Models.public_Usuario['rol'];
}

export class UsuariosRepository {
  async buscarActivoPorId(id: number): Promise<UsuarioAutenticado | null> {
    return db.orm.public.Usuario.where({ id, activo: true }).first();
  }

  async listar(filtros?: FiltrosUsuario): Promise<UsuarioAutenticado[]> {
    let query = db.orm.public.Usuario.select('id', 'nombre', 'correo', 'rol', 'activo')
      .where({ activo: true })
      .orderBy(usuario => usuario.id.asc());

    if (filtros?.rol !== undefined) {
      query = query.where({ rol: filtros.rol });
    }

    return query.all();
  }
}
