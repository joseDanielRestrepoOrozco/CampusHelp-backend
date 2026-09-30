import { db } from '../prisma/db.js';
import { ConflictError } from '../errors/app-error.js';
import type { CreateUserInput, UserPagination, UserRecord } from '../schemas/user.schema.js';

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const databaseError = error as { code?: unknown; sqlState?: unknown };
  return databaseError.code === '23505' || databaseError.sqlState === '23505';
}

export class UserRepository {
  async create(input: CreateUserInput): Promise<UserRecord> {
    try {
      return await db.orm.public.Usuario.create(input);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('Ya existe un usuario con ese correo');
      }
      throw error;
    }
  }

  async findAll({ limit, offset }: UserPagination): Promise<UserRecord[]> {
    return db.orm.public.Usuario.select('id', 'nombre', 'correo', 'rol', 'activo')
      .orderBy(usuario => usuario.id.asc())
      .offset(offset)
      .limit(limit)
      .all();
  }
}
