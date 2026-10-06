import { AppError } from '../errors/app-error.js';
import type { HistorialConUsuario } from '../repositories/historial.repository.js';
import { aFechaIso } from './fecha.js';

// Evento del historial de docs/03-api.md (HU-08):
// { id, evento, estadoAnterior, estadoNuevo, usuario: { id, nombre, rol }, fecha, comentario }.
export interface HistorialDto {
  id: number;
  evento: HistorialConUsuario['evento'];
  estadoAnterior: HistorialConUsuario['estadoAnterior'];
  estadoNuevo: HistorialConUsuario['estadoNuevo'];
  usuario: { id: number; nombre: string; rol: NonNullable<HistorialConUsuario['usuario']>['rol'] };
  fecha: string;
  comentario: string | null;
}

export function aHistorialDto(evento: HistorialConUsuario): HistorialDto {
  const { usuario } = evento;

  // La FK garantiza el usuario; si falta es una inconsistencia de datos, no un
  // error del cliente.
  if (!usuario) {
    throw new AppError(500, 'ERROR_INTERNO', 'El evento de historial no tiene usuario');
  }

  return {
    id: evento.id,
    evento: evento.evento,
    estadoAnterior: evento.estadoAnterior,
    estadoNuevo: evento.estadoNuevo,
    usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    fecha: aFechaIso(evento.fecha),
    comentario: evento.comentario,
  };
}
