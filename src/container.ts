import { UsuariosRepository } from './repositories/usuarios.repository.js';
import { HistorialRepository } from './repositories/historial.repository.js';
import { CasosRepository } from './repositories/casos.repository.js';
import { CasosController } from './controllers/casos.controller.js';

// Composition root: aquí se inyectan las dependencias una sola vez.
const usuariosRepository = new UsuariosRepository();
const historialRepository = new HistorialRepository();
const casosRepository = new CasosRepository(historialRepository);
const casosController = new CasosController(casosRepository);

export const container = {
  usuariosRepository,
  casosController,
};
