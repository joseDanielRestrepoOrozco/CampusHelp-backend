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
      return await db.orm.public.User.create(input);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('Ya existe un usuario con ese email');
      }
      throw error;
    }
  }

  async findAll({ limit, offset }: UserPagination): Promise<UserRecord[]> {
    return db.orm.public.User.select('id', 'email', 'username', 'name', 'createdAt', 'updatedAt')
      .orderBy(user => user.id.asc())
      .offset(offset)
      .limit(limit)
      .all();
  }
}
