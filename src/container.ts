import { UsuariosRepository } from './repositories/usuarios.repository.js';
import { HistorialRepository } from './repositories/historial.repository.js';
import { CasosRepository } from './repositories/casos.repository.js';
import { CasosService } from './services/casos.service.js';
import { CasosController } from './controllers/casos.controller.js';

// Composition root: aquí se inyectan las dependencias una sola vez.
const usuariosRepository = new UsuariosRepository();
const historialRepository = new HistorialRepository();
const casosRepository = new CasosRepository(historialRepository);
const casosService = new CasosService(casosRepository);
const casosController = new CasosController(casosService);

export const container = {
  usuariosRepository,
  casosController,
};
