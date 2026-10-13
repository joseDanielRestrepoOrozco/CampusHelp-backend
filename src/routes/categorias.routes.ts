import { Router } from 'express';
import { container } from '../container.js';
import { usuarioActual } from '../middleware/usuario-actual.js';

export const categoriasRouter = Router();

const autenticar = usuarioActual(container.usuariosRepository);

// GET es público. Las escrituras (HU-11) exigen X-Usuario-Id de un ADMINISTRADOR.
categoriasRouter.get('/categorias', container.categoriasController.listar);
categoriasRouter.post('/categorias', autenticar, container.categoriasController.crear);
categoriasRouter.put('/categorias/:id', autenticar, container.categoriasController.editar);
categoriasRouter.patch(
  '/categorias/:id/activa',
  autenticar,
  container.categoriasController.cambiarActiva,
);
categoriasRouter.delete('/categorias/:id', autenticar, container.categoriasController.eliminar);
