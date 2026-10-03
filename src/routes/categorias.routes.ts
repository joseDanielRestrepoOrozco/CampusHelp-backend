import { Router } from 'express';
import { container } from '../container.js';

export const categoriasRouter = Router();

// GET es público. Las rutas de escritura de HU-11 exigirán X-Usuario-Id (docs/03-api.md).
categoriasRouter.get('/categorias', container.categoriasController.listar);
