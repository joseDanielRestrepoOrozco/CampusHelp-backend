import type { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error.js';
import { parseWithSchema } from '../schemas/parse.js';
import {
  createCasoSchema,
  casoIdParamsSchema,
  cambiarEstadoSchema,
  listarCasosQuerySchema,
} from '../schemas/caso.schema.js';
import type { CasosService } from '../services/casos.service.js';

export class CasosController {
  constructor(private readonly casos: CasosService) {}

  // POST /api/casos (HU-01)
  crear = async (request: Request, response: Response): Promise<void> => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }

    const input = parseWithSchema(createCasoSchema, request.body, 'body');
    const caso = await this.casos.registrarCaso(request.usuario, input);

    response.status(201).json(caso);
  };

  // GET /api/casos (HU-02)
  listar = async (request: Request, response: Response): Promise<void> => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }

    const query = parseWithSchema(listarCasosQuerySchema, request.query, 'query');
    const casos = await this.casos.listarCasos(request.usuario, query);

    response.json(casos);
  };

  // PATCH /api/casos/:id/estado (HU-05)
  cambiarEstado = async (request: Request, response: Response): Promise<void> => {
    const usuario = request.usuario!;

    const { id } = parseWithSchema(casoIdParamsSchema, request.params, 'params');
    const { estado } = parseWithSchema(cambiarEstadoSchema, request.body, 'body');

    const caso = await this.casos.cambiarEstado(usuario, id, estado);

    response.json(caso);
  };

  // GET /api/casos/:id/historial (HU-08)
  historial = async (request: Request, response: Response): Promise<void> => {
    const usuario = request.usuario!;

    const { id } = parseWithSchema(casoIdParamsSchema, request.params, 'params');
    const eventos = await this.casos.verHistorial(usuario, id);

    response.json(eventos);
  };
}
