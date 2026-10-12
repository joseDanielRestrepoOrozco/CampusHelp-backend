import { Router } from 'express';
import { container } from '../container.js';
import { usuarioActual } from '../middleware/usuario-actual.js';

export const indicadoresRouter = Router();

const autenticar = usuarioActual(container.usuariosRepository);

indicadoresRouter.get('/indicadores', autenticar, container.indicadoresController.obtener);
