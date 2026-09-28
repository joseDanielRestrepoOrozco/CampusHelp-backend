import { z } from "zod";

function optionalText(field: string, maxLength: number) {
  return z
    .preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z
        .string({ error: `El campo '${field}' debe ser un string` })
        .trim()
        .max(maxLength, `El campo '${field}' no puede superar ${maxLength} caracteres`)
        .optional(),
    )
    .transform((value) => value ?? null);
}

export const createUserSchema = z.object({
  email: z
    .preprocess(
      (value) => (value === undefined ? "" : value),
      z
        .string({ error: "El campo 'email' debe ser un string" })
        .trim()
        .min(1, "El campo 'email' es obligatorio")
        .pipe(
          z
            .string()
            .email("El campo 'email' no tiene un formato válido")
            .max(254, "El campo 'email' no puede superar 254 caracteres"),
        ),
    ),
  username: optionalText("username", 64),
  name: optionalText("name", 120),
}).strip();

const integerQuery = (
  field: string,
  fallback: number,
  minimum: number,
  maximum: number,
) =>
  z.preprocess(
    (value) => (value === undefined || value === "" ? String(fallback) : value),
    z
      .string({ error: `El parámetro '${field}' debe ser un entero` })
      .regex(/^\d+$/, `El parámetro '${field}' debe ser un entero`)
      .transform(Number)
      .pipe(
        z
          .number()
          .int(`El parámetro '${field}' debe ser un entero`)
          .min(minimum, `El parámetro '${field}' debe ser al menos ${minimum}`)
          .max(maximum, `El parámetro '${field}' no puede superar ${maximum}`),
      ),
  );

export const userPaginationSchema = z.object({
  limit: integerQuery("limit", 50, 1, 100),
  offset: integerQuery("offset", 0, 0, 1_000_000),
});

export const userRecordSchema = z.object({
  id: z.number().int().positive(),
  email: z.string(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// `z.compile` devuelve un clon con una ruta rápida generada; el esquema original
// no se modifica y el clon se comporta igual (mismos tipos, issues y mensajes).
// La compilación es perezosa: el código se genera al primer `parse`, así que solo
// compila lo que de verdad se valida en cada petición.
export const compiledCreateUserSchema = z.compile(createUserSchema);
export const compiledUserPaginationSchema = z.compile(userPaginationSchema);

// `userRecordSchema` no se compila: solo se usa para derivar `UserRecord` y nunca
// se pasa por `parse`, así que compilarlo no aportaría nada.
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserPagination = z.infer<typeof userPaginationSchema>;
export type UserRecord = z.infer<typeof userRecordSchema>;
