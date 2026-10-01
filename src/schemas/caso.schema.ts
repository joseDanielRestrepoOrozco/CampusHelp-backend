import { z } from 'zod';

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
  areaId: z.number({ error: "El campo 'areaId' es obligatorio" }).int().positive(),
  categoriaId: z.number({ error: "El campo 'categoriaId' es obligatorio" }).int().positive(),
});

export type CreateCasoInput = z.infer<typeof createCasoSchema>;
