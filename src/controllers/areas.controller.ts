import type { Request, Response } from 'express';
import type { AreasRepository } from '../repositories/areas.repository.js';
import { aAreaDto } from '../dto/area.dto.js';

export class AreasController {
  constructor(private readonly areas: AreasRepository) {}

  // GET /api/areas (HU-01). No pide X-Usuario-Id.
  listar = async (_request: Request, response: Response): Promise<void> => {
    const areas = await this.areas.listarActivas();
    response.json(areas.map(aAreaDto));
  };
}
