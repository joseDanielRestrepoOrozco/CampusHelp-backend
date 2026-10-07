import { z } from 'zod';
import { MAX_ID_INT32 } from '../constants.js';
import { idPathParam } from './param.schema.js';
import { booleanoQuery, idQuery, listaEnumQuery } from './query.schema.js';

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

// Body de PATCH /casos/:id/clasificacion (HU-05, RN-08). Cualquier combinación de
// tipo, prioridad y categoría; areaId y categoriaId van juntos para poder
// comprobar que la categoría pertenece al área (RN-03).
export const reclasificarCasoSchema = z
  .object({
    tipo: tipoCasoSchema.optional(),
    prioridad: prioridadSchema.optional(),
    areaId: idReferencia('areaId').optional(),
    categoriaId: idReferencia('categoriaId').optional(),
  })
  .superRefine((body, ctx) => {
    const { tipo, prioridad, areaId, categoriaId } = body;

    if (
      tipo === undefined &&
      prioridad === undefined &&
      areaId === undefined &&
      categoriaId === undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Envía al menos uno de: tipo, prioridad o areaId + categoriaId',
      });
    }

    if (categoriaId !== undefined && areaId === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['areaId'],
        message: "El campo 'areaId' es obligatorio cuando se envía 'categoriaId'",
      });
    }

    if (areaId !== undefined && categoriaId === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['categoriaId'],
        message: "El campo 'categoriaId' es obligatorio cuando se envía 'areaId'",
      });
    }
  });

export type ReclasificarCasoInput = z.infer<typeof reclasificarCasoSchema>;

// Body de PATCH /casos/:id/asignar (HU-04). Si el agente se asigna a sí mismo,
// manda su propio id (docs/03-api.md).
export const asignarCasoSchema = z.object({
  agenteId: idReferencia('agenteId'),
});

export type AsignarCasoInput = z.infer<typeof asignarCasoSchema>;

// Body de POST /casos/:id/atencion (HU-06, RN-12). El `.trim()` va antes del
// `.min()`: se valida y se guarda el texto ya recortado, con mínimo 10 caracteres.
export const registrarAtencionSchema = z.object({
  diagnostico: z
    .string({ error: "El campo 'diagnostico' es obligatorio" })
    .trim()
    .min(10, 'El diagnóstico debe tener al menos 10 caracteres'),
  solucion: z
    .string({ error: "El campo 'solucion' es obligatorio" })
    .trim()
    .min(10, 'La solución debe tener al menos 10 caracteres'),
});

export type RegistrarAtencionInput = z.infer<typeof registrarAtencionSchema>;

// Ordenamiento de casos: fecha_desc por defecto o por prioridad (HU-03).
export const ordenCasosSchema = z.enum(['fecha_desc', 'prioridad'], {
  error: "El parámetro 'orden' solo admite fecha_desc o prioridad",
});

// Texto que se busca en el título (HU-09). Vacío u omitido queda como undefined
// (sin filtro); el tope es el mismo largo máximo del título (RN-04).
const busquedaQuery = z
  .preprocess(
    valor => {
      if (typeof valor !== 'string') return valor;
      const texto = valor.trim();
      return texto === '' ? undefined : texto;
    },
    z
      .string({ error: "El parámetro 'q' debe ser un texto" })
      .max(180, "El parámetro 'q' admite como máximo 180 caracteres")
      .optional(),
  )
  .optional();

// Query params de GET /api/casos (HU-02, HU-03 y HU-09). Todos se combinan con Y lógico.
export const listarCasosQuerySchema = z.object({
  solicitanteId: idQuery('solicitanteId'),
  agenteId: idQuery('agenteId'),
  abiertos: booleanoQuery('abiertos'),
  sinAgente: booleanoQuery('sinAgente'),
  estado: listaEnumQuery('estado', estadoCasoSchema.options),
  tipo: listaEnumQuery('tipo', tipoCasoSchema.options),
  prioridad: listaEnumQuery('prioridad', prioridadSchema.options),
  areaId: idQuery('areaId'),
  categoriaId: idQuery('categoriaId'),
  q: busquedaQuery,
  orden: ordenCasosSchema.default('fecha_desc'),
});

export type ListarCasosQuery = z.infer<typeof listarCasosQuerySchema>;
