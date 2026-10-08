import { UsuariosRepository } from './repositories/usuarios.repository.js';
import { AreasRepository } from './repositories/areas.repository.js';
import { CategoriasRepository } from './repositories/categorias.repository.js';
import { HistorialRepository } from './repositories/historial.repository.js';
import { CasosRepository } from './repositories/casos.repository.js';
import { CategoriasService } from './services/categorias.service.js';
import { CasosService } from './services/casos.service.js';
import { CasosController } from './controllers/casos.controller.js';
import { UsuariosController } from './controllers/usuarios.controller.js';
import { AreasController } from './controllers/areas.controller.js';
import { CategoriasController } from './controllers/categorias.controller.js';

// Composition root: aquí se inyectan las dependencias una sola vez.
const usuariosRepository = new UsuariosRepository();
const areasRepository = new AreasRepository();
const categoriasRepository = new CategoriasRepository();
const historialRepository = new HistorialRepository();
const categoriasService = new CategoriasService(categoriasRepository, areasRepository);
const casosRepository = new CasosRepository(historialRepository);
const casosService = new CasosService(casosRepository, historialRepository, usuariosRepository);

export const container = {
  // El middleware usuarioActual lo necesita para resolver X-Usuario-Id.
  usuariosRepository,
  usuariosController: new UsuariosController(usuariosRepository),
  areasController: new AreasController(areasRepository),
  categoriasController: new CategoriasController(categoriasService),
  casosController: new CasosController(casosService),
};
