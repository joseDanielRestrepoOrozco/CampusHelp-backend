import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';
import { campusRepository } from '../repositories/campus.repository.js';
import type { Usuario } from '../data/seed-data.js';

declare global {
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}

export function requireUsuario(request: Request, _response: Response, next: NextFunction): void {
  const headerValue = request.header('X-Usuario-Id');

  if (!headerValue || !/^\d+$/.test(headerValue.trim())) {
    throw new UnauthorizedError('Falta X-Usuario-Id o no corresponde a un usuario activo');
  }

  const userId = Number(headerValue.trim());
  const user = campusRepository.findUsuarioById(userId);

  if (!user || !user.activo) {
    throw new UnauthorizedError('Falta X-Usuario-Id o no corresponde a un usuario activo');
  }

  request.usuario = user;
  next();
}

export function requireRoles(...allowedRoles: Array<Usuario['rol']>) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }

    if (!allowedRoles.includes(request.usuario.rol)) {
      throw new ForbiddenError(
        'ROL_NO_PERMITIDO',
        'El rol del usuario no puede hacer esa operación',
      );
    }

    next();
  };
}
