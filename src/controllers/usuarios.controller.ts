import type { Request, Response } from 'express';
import type { UsuariosRepository } from '../repositories/usuarios.repository.js';
import { parseWithSchema } from '../schemas/parse.js';
import { usuarioQuerySchema } from '../schemas/usuario.schema.js';
import { aUsuarioDto } from '../dto/usuario.dto.js';

export class UsuariosController {
  constructor(private readonly usuarios: UsuariosRepository) {}

  // GET /api/usuarios (HU-01, selector de usuario de prueba). No pide X-Usuario-Id.
  listar = async (request: Request, response: Response): Promise<void> => {
    const filtros = parseWithSchema(usuarioQuerySchema, request.query, 'query');
    const usuarios = await this.usuarios.listarActivos(filtros);
    response.json(usuarios.map(aUsuarioDto));
  };
}
