import { z } from 'zod';
import { MAX_ID_INT32 } from '../constants.js';
import { idPathParam } from './param.schema.js';

export const tipoCasoSchema = z.enum(['INCIDENTE', 'SOLICITUD'], {
  error: "El campo 'tipo' debe ser INCIDENTE o SOLICITUD",
});

export const prioridadSchema = z.enum(['P1', 'P2', 'P3'], {
  error: 'La prioridad es obligatoria y solo puede ser P1, P2 o P3',
});

export const estadoCasoSchema = z.enum(
  ['PENDIENTE', 'EN_ANALISIS', 'EN_ATENCION', 'EN_VALIDACION', 'CERRADA'],
  {
    error:
      "El campo 'estado' debe ser PENDIENTE, EN_ANALISIS, EN_ATENCION, EN_VALIDACION o CERRADA",
  },
);

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

// Path param de /casos/:id y de sus subrutas (#18, #25, #29, #33). El validador
// genérico de ids vive en param.schema.ts.
export const casoIdParamsSchema = z.object({ id: idPathParam('id') });

// Body de PATCH /casos/:id/estado (HU-05). Solo se mueve el estado; si no es un
// valor del enum la respuesta es 400 VALIDACION desde el esquema.
export const cambiarEstadoSchema = z.object({
  estado: estadoCasoSchema,
});

// Por ahora solo `fecha_desc`; el orden por prioridad llega con la bandeja (#15).
export const ordenCasosSchema = z.enum(['fecha_desc'], {
  error: "El parámetro 'orden' solo admite fecha_desc",
});

// Query params de GET /api/casos. Llegan como texto, por eso el id se convierte
// antes de validarlo con el mismo rango que el resto de ids (int4).
export const listarCasosQuerySchema = z.object({
  solicitanteId: z
    .preprocess(
      val => (val === undefined || val === '' ? undefined : Number(val)),
      z
        .number({ error: "El parámetro 'solicitanteId' debe ser un número" })
        .int("El parámetro 'solicitanteId' debe ser un entero")
        .positive("El parámetro 'solicitanteId' debe ser mayor que cero")
        .max(MAX_ID_INT32, "El parámetro 'solicitanteId' excede el rango permitido"),
    )
    .optional(),
  orden: ordenCasosSchema.default('fecha_desc'),
});

export type ListarCasosQuery = z.infer<typeof listarCasosQuerySchema>;
