import type { Rol, UsuarioRecord } from '../repositories/usuarios.repository.js';

// Usuario de docs/03-api.md: { id, nombre, correo, rol, activo }.
export interface UsuarioDto {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
}

export function aUsuarioDto(usuario: UsuarioRecord): UsuarioDto {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    activo: usuario.activo,
  };
}
