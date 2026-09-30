import { z } from 'zod';

export const categoriaQuerySchema = z.object({
  areaId: z.preprocess(
    val => (val === undefined || val === '' ? undefined : Number(val)),
    z.number({ error: 'El parámetro areaId debe ser un número' }).int().positive().optional(),
  ),
  activa: z.preprocess(
    val => {
      if (val === undefined || val === '') return undefined;
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return val;
    },
    z.boolean({ error: 'El parámetro activa debe ser un booleano (true/false)' }).optional(),
  ),
});

export const createCategoriaSchema = z.object({
  areaId: z
    .number({ error: "El campo 'areaId' es obligatorio y debe ser un número" })
    .int("El campo 'areaId' debe ser un entero")
    .positive("El campo 'areaId' debe ser positivo"),
  nombre: z
    .string({ error: "El campo 'nombre' es obligatorio y debe ser texto" })
    .trim()
    .min(2, 'El nombre de la categoría debe tener al menos 2 caracteres')
    .max(100, 'El nombre de la categoría no puede superar 100 caracteres'),
  descripcion: z
    .string({ error: 'La descripción debe ser texto' })
    .trim()
    .max(255, 'La descripción no puede superar 255 caracteres')
    .nullable()
    .optional(),
});

export const updateCategoriaSchema = z.object({
  nombre: z
    .string({ error: "El campo 'nombre' es obligatorio y debe ser texto" })
    .trim()
    .min(2, 'El nombre de la categoría debe tener al menos 2 caracteres')
    .max(100, 'El nombre de la categoría no puede superar 100 caracteres'),
  descripcion: z
    .string({ error: 'La descripción debe ser texto' })
    .trim()
    .max(255, 'La descripción no puede superar 255 caracteres')
    .nullable()
    .optional(),
});

export const patchCategoriaActivaSchema = z.object({
  activa: z.boolean({ error: "El campo 'activa' es obligatorio y debe ser booleano" }),
});

export const casosQuerySchema = z.object({
  estado: z
    .enum(['PENDIENTE', 'EN_ANALISIS', 'EN_ATENCION', 'EN_VALIDACION', 'CERRADA'], {
      error: 'Estado inválido',
    })
    .optional(),
  tipo: z.enum(['INCIDENTE', 'SOLICITUD'], { error: 'Tipo inválido' }).optional(),
  areaId: z.preprocess(
    val => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().int().positive().optional(),
  ),
  categoriaId: z.preprocess(
    val => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().int().positive().optional(),
  ),
  prioridad: z.enum(['P1', 'P2', 'P3'], { error: 'Prioridad inválida' }).optional(),
  solicitanteId: z.preprocess(
    val => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().int().positive().optional(),
  ),
  agenteId: z.preprocess(
    val => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().int().positive().optional(),
  ),
  q: z.string().trim().optional(),
  orden: z.enum(['fecha_desc', 'prioridad']).optional().default('fecha_desc'),
  noCerrados: z.preprocess(
    val => (val === 'true' || val === true ? true : undefined),
    z.boolean().optional(),
  ),
});

export const createCasoSchema = z.object({
  tipo: z.enum(['INCIDENTE', 'SOLICITUD'], {
    error: "El campo 'tipo' debe ser INCIDENTE o SOLICITUD",
  }),
  titulo: z
    .string({ error: "El campo 'titulo' es obligatorio" })
    .trim()
    .min(5, 'El título debe tener entre 5 y 180 caracteres')
    .max(180, 'El título debe tener entre 5 y 180 caracteres'),
  descripcion: z
    .string({ error: "El campo 'descripcion' es obligatorio" })
    .trim()
    .min(10, 'Mínimo 10 caracteres'),
  prioridad: z.enum(['P1', 'P2', 'P3'], {
    error: 'La prioridad es obligatoria y solo puede ser P1, P2 o P3',
  }),
  areaId: z.number({ error: "El campo 'areaId' es obligatorio" }).int().positive(),
  categoriaId: z.number({ error: "El campo 'categoriaId' es obligatorio" }).int().positive(),
});

export const validacionCasoSchema = z
  .object({
    aprobado: z.boolean({ error: "El campo 'aprobado' es obligatorio y debe ser booleano" }),
    comentario: z.string({ error: 'El comentario debe ser texto' }).trim().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.aprobado) {
      if (!data.comentario || data.comentario.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['comentario'],
          message: 'El comentario es obligatorio al devolver el caso (mínimo 5 caracteres)',
        });
      }
    }
  });

export const asignarCasoSchema = z.object({
  agenteId: z.number({ error: "El campo 'agenteId' es obligatorio" }).int().positive(),
});

export const cambiarEstadoCasoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_ANALISIS', 'EN_ATENCION', 'EN_VALIDACION'], {
    error: 'Estado no válido para transición manual (CERRADA solo se alcanza mediante validación)',
  }),
});

export const atencionCasoSchema = z.object({
  diagnostico: z
    .string({ error: "El campo 'diagnostico' es obligatorio" })
    .trim()
    .min(5, 'El diagnóstico debe tener al menos 5 caracteres'),
  solucion: z
    .string({ error: "El campo 'solucion' es obligatorio" })
    .trim()
    .min(5, 'La solución debe tener al menos 5 caracteres'),
});

export type CategoriaQuery = z.infer<typeof categoriaQuerySchema>;
export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
export type PatchCategoriaActivaInput = z.infer<typeof patchCategoriaActivaSchema>;
export type CasosQuery = z.infer<typeof casosQuerySchema>;
export type CreateCasoInput = z.infer<typeof createCasoSchema>;
export type ValidacionCasoInput = z.infer<typeof validacionCasoSchema>;
export type AsignarCasoInput = z.infer<typeof asignarCasoSchema>;
export type CambiarEstadoCasoInput = z.infer<typeof cambiarEstadoCasoSchema>;
export type AtencionCasoInput = z.infer<typeof atencionCasoSchema>;
