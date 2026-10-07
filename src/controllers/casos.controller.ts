import type { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error.js';
import { parseWithSchema } from '../schemas/parse.js';
import {
  asignarCasoSchema,
  createCasoSchema,
  casoIdParamsSchema,
  cambiarEstadoSchema,
  listarCasosQuerySchema,
  reclasificarCasoSchema,
  registrarAtencionSchema,
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

  // PATCH /api/casos/:id/clasificacion (HU-05)
  reclasificar = async (request: Request, response: Response): Promise<void> => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }

    const { id } = parseWithSchema(casoIdParamsSchema, request.params, 'params');
    const input = parseWithSchema(reclasificarCasoSchema, request.body, 'body');

    const caso = await this.casos.reclasificarCaso(request.usuario, id, input);

    response.json(caso);
  };

  // PATCH /api/casos/:id/asignar (HU-04)
  asignar = async (request: Request, response: Response): Promise<void> => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }

    const { id } = parseWithSchema(casoIdParamsSchema, request.params, 'params');
    const { agenteId } = parseWithSchema(asignarCasoSchema, request.body, 'body');

    const caso = await this.casos.asignarCaso(request.usuario, id, agenteId);

    response.json(caso);
  };

  // POST /api/casos/:id/atencion (HU-06)
  atender = async (request: Request, response: Response): Promise<void> => {
    const { id } = parseWithSchema(casoIdParamsSchema, request.params, 'params');
    const input = parseWithSchema(registrarAtencionSchema, request.body, 'body');

    const atencion = await this.casos.registrarAtencion(request.usuario, id, input);

    response.status(201).json(atencion);
  };

  // GET /api/casos/:id/historial (HU-08)
  historial = async (request: Request, response: Response): Promise<void> => {
    const usuario = request.usuario!;

    const { id } = parseWithSchema(casoIdParamsSchema, request.params, 'params');
    const eventos = await this.casos.verHistorial(usuario, id);

    response.json(eventos);
  };
}
