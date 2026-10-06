import { Router } from 'express';
import { container } from '../container.js';
import { usuarioActual } from '../middleware/usuario-actual.js';

export const casosRouter = Router();

const autenticar = usuarioActual(container.usuariosRepository);

casosRouter.post('/casos', autenticar, container.casosController.crear);
casosRouter.get('/casos', autenticar, container.casosController.listar);
casosRouter.patch('/casos/:id/estado', autenticar, container.casosController.cambiarEstado);
casosRouter.get('/casos/:id/historial', autenticar, container.casosController.historial);
