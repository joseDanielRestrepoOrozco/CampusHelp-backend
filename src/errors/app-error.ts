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

export interface ValidationIssue {
  campo: string;
  mensaje: string;
}

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly detalles: ValidationIssue[] = [],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(detalles: ValidationIssue[], message = 'Error de validación en la solicitud') {
    super('VALIDACION', message, 400, detalles);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Falta X-Usuario-Id o no corresponde a un usuario activo') {
    super('USUARIO_REQUERIDO', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(code: 'ROL_NO_PERMITIDO' | 'NO_ES_AGENTE_ASIGNADO' | 'CASO_AJENO', message: string) {
    super(code, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super('NO_ENCONTRADO', message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(
    codeOrMessage:
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
      | string,
    message?: string,
  ) {
    if (message !== undefined) {
      super(codeOrMessage as ErrorCode, message, 409);
    } else {
      super('CATEGORIA_DUPLICADA', codeOrMessage, 409);
    }
  }
}
