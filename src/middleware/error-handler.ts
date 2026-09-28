import type { ErrorRequestHandler } from 'express';
import { AppError, ValidationError } from '../errors/app-error.js';

function hasErrorType(error: unknown, type: string): boolean {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === type;
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ValidationError) {
    response.status(error.statusCode).json({
      error: error.message,
      issues: error.issues,
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (hasErrorType(error, 'entity.parse.failed')) {
    response.status(400).json({ error: 'El cuerpo debe contener JSON válido' });
    return;
  }

  if (hasErrorType(error, 'entity.too.large')) {
    response.status(413).json({ error: 'El cuerpo de la solicitud es demasiado grande' });
    return;
  }

  console.error('Error no controlado en la solicitud', {
    error,
    method: request.method,
    path: request.path,
  });
  response.status(500).json({ error: 'Error interno del servidor' });
};
