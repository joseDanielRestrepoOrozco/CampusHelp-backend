import type { CategoriaRecord } from '../repositories/categorias.repository.js';

// Categoría de docs/03-api.md: { id, areaId, nombre, descripcion, activa }.
export interface CategoriaDto {
  id: number;
  areaId: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

export function aCategoriaDto(categoria: CategoriaRecord): CategoriaDto {
  return {
    id: categoria.id,
    areaId: categoria.areaId,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion,
    activa: categoria.activa,
  };
}
