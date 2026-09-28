import { z } from "zod";
import { ValidationError } from "../errors/app-error.js";

export function parseWithSchema<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  rootField: string,
): z.output<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => ({
        field: issue.path.map(String).join(".") || rootField,
        message: issue.message,
      })),
    );
  }

  return result.data;
}
