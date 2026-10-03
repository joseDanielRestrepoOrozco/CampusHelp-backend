import { Router } from 'express';
import { container } from '../container.js';

export const usuariosRouter = Router();

// Público: el selector de usuario se carga antes de elegir uno.
usuariosRouter.get('/usuarios', container.usuariosController.listar);
