import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error.js';
import type {
  UsuarioAutenticado,
  UsuariosRepository,
} from '../repositories/usuarios.repository.js';

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

// Factory con DI: el middleware recibe el repositorio de usuarios inyectado.
export function usuarioActual(usuarios: UsuariosRepository) {
  return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    const headerValue = request.header('X-Usuario-Id');

    if (!headerValue || !/^\d+$/.test(headerValue.trim())) {
      throw new UnauthorizedError();
    }

    const usuario = await usuarios.buscarActivoPorId(Number(headerValue.trim()));
    if (!usuario) {
      throw new UnauthorizedError();
    }

    request.usuario = usuario;
    next();
  };
}
