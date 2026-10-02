import type { Request, Response } from 'express';
import type { UsuariosRepository } from '../repositories/usuarios.repository.js';
import type { AreasRepository } from '../repositories/areas.repository.js';
import type { CategoriasRepository } from '../repositories/categorias.repository.js';
import { parseWithSchema } from '../schemas/parse.js';
import { categoriaQuerySchema, usuarioQuerySchema } from '../schemas/catalogo.schema.js';
import { aAreaDto, aCategoriaDto, aUsuarioDto } from '../dto/catalogo.dto.js';

export class CatalogosController {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly areas: AreasRepository,
    private readonly categorias: CategoriasRepository,
  ) {}

  // GET /api/usuarios (no requiere X-Usuario-Id)
  listarUsuarios = async (request: Request, response: Response): Promise<void> => {
    const filtros = parseWithSchema(usuarioQuerySchema, request.query, 'query');
    const usuarios = await this.usuarios.listar(filtros);
    response.json(usuarios.map(aUsuarioDto));
  };

  // GET /api/areas (no requiere X-Usuario-Id)
  listarAreas = async (_request: Request, response: Response): Promise<void> => {
    const areas = await this.areas.listarActivas();
    response.json(areas.map(aAreaDto));
  };

  // GET /api/categorias (no requiere X-Usuario-Id)
  listarCategorias = async (request: Request, response: Response): Promise<void> => {
    const filtros = parseWithSchema(categoriaQuerySchema, request.query, 'query');
    const categorias = await this.categorias.listar(filtros);
    response.json(categorias.map(aCategoriaDto));
  };
}
