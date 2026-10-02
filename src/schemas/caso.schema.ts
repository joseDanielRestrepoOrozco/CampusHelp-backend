import { z } from 'zod';
import { MAX_ID_INT32 } from '../constants.js';

export const tipoCasoSchema = z.enum(['INCIDENTE', 'SOLICITUD'], {
  error: "El campo 'tipo' debe ser INCIDENTE o SOLICITUD",
});

export const prioridadSchema = z.enum(['P1', 'P2', 'P3'], {
  error: 'La prioridad es obligatoria y solo puede ser P1, P2 o P3',
});

export const estadoCasoSchema = z.enum([
  'PENDIENTE',
  'EN_ANALISIS',
  'EN_ATENCION',
  'EN_VALIDACION',
  'CERRADA',
]);

// Un id referencia (área o categoría) es un entero positivo dentro del rango de
// int4 de Postgres. Sin el tope, un id gigante pasa el esquema y la consulta
// falla con 500 en lugar de responder 400 VALIDACION.
const idReferencia = (campo: string) =>
  z
    .number({ error: `El campo '${campo}' es obligatorio` })
    .int(`El campo '${campo}' debe ser un entero`)
    .positive(`El campo '${campo}' debe ser mayor que cero`)
    .max(MAX_ID_INT32, `El campo '${campo}' no corresponde a un registro existente`);

export const createCasoSchema = z.object({
  tipo: tipoCasoSchema,
  titulo: z
    .string({ error: "El campo 'titulo' es obligatorio" })
    .trim()
    .min(5, 'El título debe tener entre 5 y 180 caracteres')
    .max(180, 'El título debe tener entre 5 y 180 caracteres'),
  descripcion: z
    .string({ error: "El campo 'descripcion' es obligatorio" })
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres'),
  prioridad: prioridadSchema,
  areaId: idReferencia('areaId'),
  categoriaId: idReferencia('categoriaId'),
});

export type CreateCasoInput = z.infer<typeof createCasoSchema>;
