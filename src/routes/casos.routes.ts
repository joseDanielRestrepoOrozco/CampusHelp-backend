import { Router } from 'express';
import { container } from '../container.js';
import { usuarioActual } from '../middleware/usuario-actual.js';

export const casosRouter = Router();

const autenticar = usuarioActual(container.usuariosRepository);

casosRouter.post('/casos', autenticar, container.casosController.crear);
