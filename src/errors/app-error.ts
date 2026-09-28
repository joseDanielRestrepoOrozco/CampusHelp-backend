export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  constructor(public readonly issues: ValidationIssue[]) {
    super('Datos inválidos', 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
