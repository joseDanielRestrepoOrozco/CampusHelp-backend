import type { AreaRecord } from '../repositories/areas.repository.js';

// Área de docs/03-api.md: { id, nombre, descripcion }. `activa` no se expone
// porque GET /api/areas solo devuelve áreas activas.
export interface AreaDto {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export function aAreaDto(area: AreaRecord): AreaDto {
  return {
    id: area.id,
    nombre: area.nombre,
    descripcion: area.descripcion,
  };
}
