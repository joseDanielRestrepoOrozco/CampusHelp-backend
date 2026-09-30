import { Router } from 'express';
import { campusController } from '../controllers/campus.controller.js';
import { requireUsuario, requireRoles } from '../middleware/auth.middleware.js';

export const campusRouter = Router();

// 1. Endpoints Base (no requieren X-Usuario-Id) - HU-01
campusRouter.get('/usuarios', campusController.getUsuarios);
campusRouter.get('/areas', campusController.getAreas);
campusRouter.get('/categorias', campusController.getCategorias);

// 2. Administración de Categorías (exigen X-Usuario-Id y rol ADMINISTRADOR) - HU-11
campusRouter.post(
  '/categorias',
  requireUsuario,
  requireRoles('ADMINISTRADOR'),
  campusController.createCategoria,
);
campusRouter.put(
  '/categorias/:id',
  requireUsuario,
  requireRoles('ADMINISTRADOR'),
  campusController.updateCategoria,
);
campusRouter.patch(
  '/categorias/:id/activa',
  requireUsuario,
  requireRoles('ADMINISTRADOR'),
  campusController.patchCategoriaActiva,
);
campusRouter.delete(
  '/categorias/:id',
  requireUsuario,
  requireRoles('ADMINISTRADOR'),
  campusController.deleteCategoria,
);

// 3. Casos (exigen X-Usuario-Id) - HU-01, HU-02, HU-03, HU-04, HU-05, HU-06, HU-07, HU-08, HU-12
campusRouter.get('/casos', requireUsuario, campusController.getCasos);
campusRouter.post('/casos', requireUsuario, campusController.createCaso);
campusRouter.get('/casos/:id', requireUsuario, campusController.getCasoById);
campusRouter.patch('/casos/:id/asignar', requireUsuario, campusController.asignarCaso);
campusRouter.patch('/casos/:id/estado', requireUsuario, campusController.cambiarEstado);
campusRouter.post('/casos/:id/atencion', requireUsuario, campusController.registrarAtencion);
campusRouter.post(
  '/casos/:id/validacion',
  requireUsuario,
  requireRoles('VALIDADOR', 'ADMINISTRADOR'),
  campusController.validarCaso,
);
campusRouter.get('/casos/:id/historial', requireUsuario, campusController.getHistorial);

// 4. Indicadores (exige X-Usuario-Id) - HU-10
campusRouter.get('/indicadores', requireUsuario, campusController.getIndicadores);
