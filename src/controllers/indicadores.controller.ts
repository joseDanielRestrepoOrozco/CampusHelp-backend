import type { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error.js';
import { parseWithSchema } from '../schemas/parse.js';
import { indicadoresQuerySchema } from '../schemas/indicador.schema.js';
import type { IndicadoresService } from '../services/indicadores.service.js';

export class IndicadoresController {
  constructor(private readonly indicadores: IndicadoresService) {}

  // GET /api/indicadores (HU-10). Orden de errores del contrato: 401 (middleware)
  // → 400 (query) → 403 (rol).
  obtener = async (request: Request, response: Response): Promise<void> => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }

    const query = parseWithSchema(indicadoresQuerySchema, request.query, 'query');
    const indicadores = await this.indicadores.obtener(request.usuario, query);

    response.json(indicadores);
  };
}
