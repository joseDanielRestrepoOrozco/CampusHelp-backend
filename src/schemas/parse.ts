import { z } from 'zod';
import { ValidationError, type ValidationIssue } from '../errors/app-error.js';

export function parseWithSchema<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  rootField: string,
): z.output<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issues: ValidationIssue[] = result.error.issues.map(issue => ({
      campo: issue.path.map(String).join('.') || rootField,
      mensaje: issue.message,
    }));
    throw new ValidationError(issues);
  }

  return result.data;
}
