import type { NextFunction, Request, Response } from 'express';
import { MAX_ID_INT32 } from '../constants.js';
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

// La cabecera debe ser un entero positivo dentro del rango de int4 de Postgres.
// Un id fuera de rango no puede corresponder a ningún usuario, así que se trata
// como cabecera inválida (401) en lugar de dejar que la consulta falle con 500.
function esIdValido(headerValue: string): boolean {
  const id = Number(headerValue.trim());
  return /^\d+$/.test(headerValue.trim()) && id >= 1 && id <= MAX_ID_INT32;
}

// Factory con DI: el middleware recibe el repositorio de usuarios inyectado.
export function usuarioActual(usuarios: UsuariosRepository) {
  return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    const headerValue = request.header('X-Usuario-Id');

    if (!headerValue || !esIdValido(headerValue)) {
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
