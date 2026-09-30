import type { Request, Response } from 'express';
import { campusRepository } from '../repositories/campus.repository.js';
import { parseWithSchema } from '../schemas/parse.js';
import {
  categoriaQuerySchema,
  createCategoriaSchema,
  updateCategoriaSchema,
  patchCategoriaActivaSchema,
  casosQuerySchema,
  createCasoSchema,
  validacionCasoSchema,
  asignarCasoSchema,
  cambiarEstadoCasoSchema,
  atencionCasoSchema,
} from '../schemas/campus.schema.js';
import { NotFoundError, UnauthorizedError } from '../errors/app-error.js';

export class CampusController {
  // GET /usuarios
  getUsuarios = (_request: Request, response: Response): void => {
    const usuarios = campusRepository.findUsuarios();
    response.json(usuarios);
  };

  // GET /areas
  getAreas = (_request: Request, response: Response): void => {
    const areas = campusRepository.findAreas(true);
    response.json(areas);
  };

  // GET /categorias?areaId=&activa=
  getCategorias = (request: Request, response: Response): void => {
    const query = parseWithSchema(categoriaQuerySchema, request.query, 'query');
    const categorias = campusRepository.findCategorias(query);
    response.json(categorias);
  };

  // POST /categorias (HU-11)
  createCategoria = (request: Request, response: Response): void => {
    const input = parseWithSchema(createCategoriaSchema, request.body, 'body');
    const nuevaCategoria = campusRepository.createCategoria(input);
    response.status(201).json(nuevaCategoria);
  };

  // PUT /categorias/:id (HU-11)
  updateCategoria = (request: Request, response: Response): void => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError('No existe la categoría solicitada');
    }
    const input = parseWithSchema(updateCategoriaSchema, request.body, 'body');
    const updated = campusRepository.updateCategoria(id, input);
    response.json(updated);
  };

  // PATCH /categorias/:id/activa (HU-11)
  patchCategoriaActiva = (request: Request, response: Response): void => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError('No existe la categoría solicitada');
    }
    const input = parseWithSchema(patchCategoriaActivaSchema, request.body, 'body');
    const updated = campusRepository.setCategoriaActiva(id, input.activa);
    response.json(updated);
  };

  // DELETE /categorias/:id (HU-11)
  deleteCategoria = (request: Request, response: Response): void => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError('No existe la categoría solicitada');
    }
    campusRepository.deleteCategoria(id);
    response.json({ mensaje: 'Categoría eliminada' });
  };

  // GET /casos (HU-02, HU-03, HU-09)
  getCasos = (request: Request, response: Response): void => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }
    const query = parseWithSchema(casosQuerySchema, request.query, 'query');
    const casos = campusRepository.findCasos(query, request.usuario);
    response.json(casos);
  };

  // GET /casos/:id (HU-12)
  getCasoById = (request: Request, response: Response): void => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError('No existe el caso solicitado');
    }
    const caso = campusRepository.findCasoById(id, request.usuario);
    if (!caso) {
      throw new NotFoundError('No existe el caso solicitado');
    }
    response.json(caso);
  };

  // POST /casos (HU-01)
  createCaso = (request: Request, response: Response): void => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }
    const input = parseWithSchema(createCasoSchema, request.body, 'body');
    const nuevoCaso = campusRepository.createCaso(input, request.usuario);
    response.status(201).json(nuevoCaso);
  };

  // PATCH /casos/:id/asignar (HU-04)
  asignarCaso = (request: Request, response: Response): void => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError('No existe el caso solicitado');
    }
    const input = parseWithSchema(asignarCasoSchema, request.body, 'body');
    const caso = campusRepository.asignarCaso(id, input.agenteId, request.usuario);
    response.json(caso);
  };

  // PATCH /casos/:id/estado (HU-05)
  cambiarEstado = (request: Request, response: Response): void => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError('No existe el caso solicitado');
    }
    const input = parseWithSchema(cambiarEstadoCasoSchema, request.body, 'body');
    const caso = campusRepository.cambiarEstado(id, input.estado, request.usuario);
    response.json(caso);
  };

  // POST /casos/:id/atencion (HU-06)
  registrarAtencion = (request: Request, response: Response): void => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError('No existe el caso solicitado');
    }
    const input = parseWithSchema(atencionCasoSchema, request.body, 'body');
    const atencion = campusRepository.registrarAtencion(
      id,
      input.diagnostico,
      input.solucion,
      request.usuario,
    );
    response.status(201).json(atencion);
  };

  // POST /casos/:id/validacion (HU-07)
  validarCaso = (request: Request, response: Response): void => {
    if (!request.usuario) {
      throw new UnauthorizedError();
    }
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError('No existe el caso solicitado');
    }
    const input = parseWithSchema(validacionCasoSchema, request.body, 'body');
    const casoActualizado = campusRepository.validarCaso(
      id,
      input.aprobado,
      input.comentario,
      request.usuario,
    );
    response.json(casoActualizado);
  };

  // GET /casos/:id/historial (HU-08)
  getHistorial = (request: Request, response: Response): void => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError('No existe el caso solicitado');
    }
    const historial = campusRepository.findHistorialByCasoId(id, request.usuario);
    response.json(historial);
  };

  // GET /indicadores (HU-10)
  getIndicadores = (request: Request, response: Response): void => {
    const desde = typeof request.query.desde === 'string' ? request.query.desde : undefined;
    const hasta = typeof request.query.hasta === 'string' ? request.query.hasta : undefined;
    const indicadores = campusRepository.getIndicadores({ desde, hasta });
    response.json(indicadores);
  };
}

export const campusController = new CampusController();
