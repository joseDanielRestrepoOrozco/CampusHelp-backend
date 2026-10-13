import { z } from 'zod';
import { ValidationError, type DetalleError } from '../errors/app-error.js';

export function zodIssuesToDetalles(
  issues: z.core.$ZodIssue[],
  rootField = 'body',
): DetalleError[] {
  return issues.map(issue => ({
    campo: issue.path.map(String).join('.') || rootField,
    mensaje: issue.message,
  }));
}

export function parseWithSchema<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  rootField: string,
): z.output<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(zodIssuesToDetalles(result.error.issues, rootField));
  }

  return result.data;
}
