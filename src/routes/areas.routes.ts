import { Router } from 'express';
import { container } from '../container.js';

export const areasRouter = Router();

// Público: lo usa el formulario de registro antes de pedir usuario.
areasRouter.get('/areas', container.areasController.listar);
