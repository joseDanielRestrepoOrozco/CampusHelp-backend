import { z } from 'zod';
import { AppError } from '../errors/app-error.js';
import type { CasoConRelaciones } from '../repositories/casos.repository.js';
import { estadoCasoSchema, prioridadSchema, tipoCasoSchema } from '../schemas/caso.schema.js';
import { aFechaIso } from './fecha.js';

// El contrato (docs/03-api.md) exige fechas en ISO 8601 UTC.
const fechaIso = z.iso.datetime();

export const casoDtoSchema = z.object({
  id: z.number().int().positive(),
  tipo: tipoCasoSchema,
  titulo: z.string(),
  descripcion: z.string(),
  prioridad: prioridadSchema,
  estado: estadoCasoSchema,
  solicitante: z.object({ id: z.number().int(), nombre: z.string() }),
  agente: z.object({ id: z.number().int(), nombre: z.string() }).nullable(),
  categoria: z.object({ id: z.number().int(), nombre: z.string() }),
  area: z.object({ id: z.number().int(), nombre: z.string() }),
  fechaCreacion: fechaIso,
  fechaAsignacion: fechaIso.nullable(),
  fechaCierre: fechaIso.nullable(),
});

export type CasoDto = z.infer<typeof casoDtoSchema>;

export function aCasoDto(caso: CasoConRelaciones): CasoDto {
  const { solicitante, agente, categoria } = caso;

  // Las claves foráneas garantizan solicitante/categoria/area; si faltan es una
  // inconsistencia de datos, no un error del cliente.
  if (!solicitante || !categoria || !categoria.area) {
    throw new AppError(500, 'ERROR_INTERNO', 'El caso no tiene sus relaciones completas');
  }

  return {
    id: caso.id,
    tipo: caso.tipo,
    titulo: caso.titulo,
    descripcion: caso.descripcion,
    prioridad: caso.prioridad,
    estado: caso.estado,
    solicitante: { id: solicitante.id, nombre: solicitante.nombre },
    agente: agente ? { id: agente.id, nombre: agente.nombre } : null,
    categoria: { id: categoria.id, nombre: categoria.nombre },
    area: { id: categoria.area.id, nombre: categoria.area.nombre },
    fechaCreacion: aFechaIso(caso.fechaCreacion),
    fechaAsignacion: aFechaIso(caso.fechaAsignacion),
    fechaCierre: aFechaIso(caso.fechaCierre),
  };
}
