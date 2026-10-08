import type { Request, Response } from 'express';
import type { CategoriasService } from '../services/categorias.service.js';
import { parseWithSchema } from '../schemas/parse.js';
import {
  categoriaIdParamsSchema,
  categoriaQuerySchema,
  cambiarActivaSchema,
  crearCategoriaSchema,
  editarCategoriaSchema,
} from '../schemas/categoria.schema.js';

export class CategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  // GET /api/categorias (HU-01, HU-11). No pide X-Usuario-Id.
  listar = async (request: Request, response: Response): Promise<void> => {
    const filtros = parseWithSchema(categoriaQuerySchema, request.query, 'query');
    response.json(await this.categorias.listar(filtros));
  };

  // POST /api/categorias (HU-11)
  crear = async (request: Request, response: Response): Promise<void> => {
    const usuario = request.usuario!;
    const input = parseWithSchema(crearCategoriaSchema, request.body, 'body');

    response.status(201).json(await this.categorias.crear(usuario, input));
  };

  // PUT /api/categorias/:id (HU-11)
  editar = async (request: Request, response: Response): Promise<void> => {
    const usuario = request.usuario!;
    const { id } = parseWithSchema(categoriaIdParamsSchema, request.params, 'params');
    const input = parseWithSchema(editarCategoriaSchema, request.body, 'body');

    response.json(await this.categorias.editar(usuario, id, input));
  };

  // PATCH /api/categorias/:id/activa (HU-11)
  cambiarActiva = async (request: Request, response: Response): Promise<void> => {
    const usuario = request.usuario!;
    const { id } = parseWithSchema(categoriaIdParamsSchema, request.params, 'params');
    const { activa } = parseWithSchema(cambiarActivaSchema, request.body, 'body');

    response.json(await this.categorias.cambiarActiva(usuario, id, activa));
  };

  // DELETE /api/categorias/:id (HU-11)
  eliminar = async (request: Request, response: Response): Promise<void> => {
    const usuario = request.usuario!;
    const { id } = parseWithSchema(categoriaIdParamsSchema, request.params, 'params');

    await this.categorias.eliminar(usuario, id);
    response.status(204).end();
  };
}
