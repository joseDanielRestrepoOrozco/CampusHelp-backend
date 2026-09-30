import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error.js';

function hasErrorType(error: unknown, type: string): boolean {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === type;
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: error.code,
      mensaje: error.message,
      detalles: error.detalles,
    });
    return;
  }

  if (hasErrorType(error, 'entity.parse.failed')) {
    response.status(400).json({
      error: 'VALIDACION',
      mensaje: 'El cuerpo debe contener JSON válido',
      detalles: [],
    });
    return;
  }

  if (hasErrorType(error, 'entity.too.large')) {
    response.status(413).json({
      error: 'VALIDACION',
      mensaje: 'El cuerpo de la solicitud es demasiado grande',
      detalles: [],
    });
    return;
  }

  console.error('Error no controlado en la solicitud', {
    error,
    method: request.method,
    path: request.path,
  });

  response.status(500).json({
    error: 'ERROR_INTERNO',
    mensaje: 'Error interno del servidor',
    detalles: [],
  });
};
