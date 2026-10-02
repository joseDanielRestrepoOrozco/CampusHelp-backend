import type { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error.js';
import { parseWithSchema } from '../schemas/parse.js';
import { createCasoSchema } from '../schemas/caso.schema.js';
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
}
