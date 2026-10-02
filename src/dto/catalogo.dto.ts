import type { UsuarioAutenticado } from '../repositories/usuarios.repository.js';
import type { AreaRecord } from '../repositories/areas.repository.js';
import type { CategoriaRecord } from '../repositories/categorias.repository.js';

export interface UsuarioDto {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
}

export interface AreaDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

export interface CategoriaDto {
  id: number;
  areaId: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

export function aUsuarioDto(usuario: UsuarioAutenticado): UsuarioDto {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    activo: usuario.activo,
  };
}

export function aAreaDto(area: AreaRecord): AreaDto {
  return {
    id: area.id,
    nombre: area.nombre,
    descripcion: area.descripcion,
    activa: area.activa,
  };
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
