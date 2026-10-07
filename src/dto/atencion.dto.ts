import { AppError } from '../errors/app-error.js';
import type { AtencionConAgente } from '../repositories/atenciones.repository.js';
import { aFechaIso } from './fecha.js';

// Atención de docs/03-api.md (HU-06):
// { id, casoId, diagnostico, solucion, fecha, agente: { id, nombre } }.
export interface AtencionDto {
  id: number;
  casoId: number;
  diagnostico: string;
  solucion: string;
  fecha: string;
  agente: { id: number; nombre: string };
}

export function aAtencionDto(atencion: AtencionConAgente): AtencionDto {
  const { agente } = atencion;

  // La FK garantiza el agente; si falta es una inconsistencia de datos, no un
  // error del cliente.
  if (!agente) {
    throw new AppError(500, 'ERROR_INTERNO', 'La atención no tiene agente');
  }

  return {
    id: atencion.id,
    casoId: atencion.casoId,
    diagnostico: atencion.diagnostico,
    solucion: atencion.solucion,
    fecha: aFechaIso(atencion.fecha),
    agente: { id: agente.id, nombre: agente.nombre },
  };
}
