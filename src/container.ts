import { UsuariosRepository } from './repositories/usuarios.repository.js';
import { AreasRepository } from './repositories/areas.repository.js';
import { CategoriasRepository } from './repositories/categorias.repository.js';
import { HistorialRepository } from './repositories/historial.repository.js';
import { CasosRepository } from './repositories/casos.repository.js';
import { CasosService } from './services/casos.service.js';
import { CasosController } from './controllers/casos.controller.js';
import { CatalogosController } from './controllers/catalogos.controller.js';

// Composition root: aquí se inyectan las dependencias una sola vez.
const usuariosRepository = new UsuariosRepository();
const areasRepository = new AreasRepository();
const categoriasRepository = new CategoriasRepository();
const historialRepository = new HistorialRepository();
const casosRepository = new CasosRepository(historialRepository);
const casosService = new CasosService(casosRepository);
const casosController = new CasosController(casosService);
const catalogosController = new CatalogosController(
  usuariosRepository,
  areasRepository,
  categoriasRepository,
);

export const container = {
  usuariosRepository,
  areasRepository,
  categoriasRepository,
  casosController,
  catalogosController,
};
