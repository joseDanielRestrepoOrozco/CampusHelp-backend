import { z } from 'zod';
import { MAX_ID_INT32 } from '../constants.js';

export const rolSchema = z.enum(['SOLICITANTE', 'AGENTE', 'VALIDADOR', 'ADMINISTRADOR'], {
  error: "El parámetro 'rol' debe ser SOLICITANTE, AGENTE, VALIDADOR o ADMINISTRADOR",
});

export const usuarioQuerySchema = z.object({
  rol: rolSchema.optional(),
  activo: z
    .preprocess(
      val => {
        if (val === undefined || val === '') return undefined;
        if (val === 'true' || val === true) return true;
        if (val === 'false' || val === false) return false;
        return val;
      },
      z.boolean({ error: "El parámetro 'activo' debe ser un booleano (true/false)" }),
    )
    .optional(),
});

export type UsuarioQuery = z.infer<typeof usuarioQuerySchema>;

export const categoriaQuerySchema = z.object({
  areaId: z
    .preprocess(
      val => (val === undefined || val === '' ? undefined : Number(val)),
      z
        .number({ error: "El parámetro 'areaId' debe ser un número" })
        .int("El parámetro 'areaId' debe ser un entero")
        .positive("El parámetro 'areaId' debe ser mayor que cero")
        .max(MAX_ID_INT32, "El parámetro 'areaId' excede el rango permitido"),
    )
    .optional(),
  activa: z
    .preprocess(
      val => {
        if (val === undefined || val === '') return undefined;
        if (val === 'true' || val === true) return true;
        if (val === 'false' || val === false) return false;
        return val;
      },
      z.boolean({ error: "El parámetro 'activa' debe ser un booleano (true/false)" }),
    )
    .optional(),
});

export type CategoriaQuery = z.infer<typeof categoriaQuerySchema>;
