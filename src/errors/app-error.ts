// Lista cerrada de códigos del contrato (docs/03-api.md, sección "Errores").
// El frontend decide qué mostrar según el código: no se inventan códigos nuevos
// sin agregarlos primero al contrato.
export type ErrorCode =
  | 'VALIDACION'
  | 'USUARIO_REQUERIDO'
  | 'ROL_NO_PERMITIDO'
  | 'NO_ES_AGENTE_ASIGNADO'
  | 'CASO_AJENO'
  | 'NO_ENCONTRADO'
  | 'CATEGORIA_INVALIDA'
  | 'TRANSICION_INVALIDA'
  | 'CASO_CERRADO'
  | 'ESTADO_NO_PERMITE_OPERACION'
  | 'SIN_AGENTE_ASIGNADO'
  | 'SIN_SOLUCION'
  | 'AGENTE_INVALIDO'
  | 'VALIDADOR_ES_AGENTE'
  | 'CATEGORIA_DUPLICADA'
  | 'CATEGORIA_CON_CASOS'
  | 'ERROR_INTERNO';

export interface DetalleError {
  campo: string;
  mensaje: string;
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly codigo: ErrorCode,
    mensaje: string,
    public readonly detalles: DetalleError[] = [],
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(detalles: DetalleError[], mensaje = 'Error de validación en la solicitud') {
    super(400, 'VALIDACION', mensaje, detalles);
  }
}

export class UnauthorizedError extends AppError {
  constructor(mensaje = 'Falta X-Usuario-Id o no corresponde a un usuario activo') {
    super(401, 'USUARIO_REQUERIDO', mensaje);
  }
}

export class ForbiddenError extends AppError {
  constructor(codigo: ErrorCode, mensaje: string) {
    super(403, codigo, mensaje);
  }
}

export class NotFoundError extends AppError {
  constructor(mensaje = 'Recurso no encontrado') {
    super(404, 'NO_ENCONTRADO', mensaje);
  }
}

export class ConflictError extends AppError {
  constructor(codigo: ErrorCode, mensaje: string) {
    super(409, codigo, mensaje);
  }
}
