import { db } from '../prisma/db.js';
import type { Models } from '../prisma/contract.js';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';

export type UsuarioRecord = Scalars<Models.public_Usuario>;
export type Rol = UsuarioRecord['rol'];

// El usuario que deja el middleware usuarioActual en req.usuario: siempre activo.
export type UsuarioAutenticado = UsuarioRecord;

export interface FiltrosUsuario {
  rol?: Rol;
}

// Único acceso a la tabla usuario.
export class UsuariosRepository {
  async buscarActivoPorId(id: number): Promise<UsuarioRecord | null> {
    return db.orm.public.Usuario.where({ id, activo: true }).first();
  }

  // GET /api/usuarios: solo los activos, ordenados por id (docs/03-api.md).
  async listarActivos(filtros?: FiltrosUsuario): Promise<UsuarioRecord[]> {
    let query = db.orm.public.Usuario.select('id', 'nombre', 'correo', 'rol', 'activo')
      .where({ activo: true })
      .orderBy(usuario => usuario.id.asc());

    if (filtros?.rol !== undefined) {
      query = query.where({ rol: filtros.rol });
    }

    return query.all();
  }
}
