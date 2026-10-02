import { Router } from 'express';
import { container } from '../container.js';

export const catalogosRouter = Router();

// Endpoints Base de consulta (no requieren X-Usuario-Id) - HU-01
catalogosRouter.get('/usuarios', container.catalogosController.listarUsuarios);
catalogosRouter.get('/areas', container.catalogosController.listarAreas);
catalogosRouter.get('/categorias', container.catalogosController.listarCategorias);
