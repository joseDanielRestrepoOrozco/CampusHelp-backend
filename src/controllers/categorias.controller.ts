import type { Request, Response } from 'express';
import type { CategoriasRepository } from '../repositories/categorias.repository.js';
import { parseWithSchema } from '../schemas/parse.js';
import { categoriaQuerySchema } from '../schemas/categoria.schema.js';
import { aCategoriaDto } from '../dto/categoria.dto.js';

export class CategoriasController {
  constructor(private readonly categorias: CategoriasRepository) {}

  // GET /api/categorias (HU-01, HU-11). No pide X-Usuario-Id.
  listar = async (request: Request, response: Response): Promise<void> => {
    const filtros = parseWithSchema(categoriaQuerySchema, request.query, 'query');
    const categorias = await this.categorias.listar(filtros);
    response.json(categorias.map(aCategoriaDto));
  };
}
