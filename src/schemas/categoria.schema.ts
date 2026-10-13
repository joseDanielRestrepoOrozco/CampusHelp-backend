import { z } from 'zod';
import { MAX_ID_INT32 } from '../constants.js';
import { idPathParam } from './param.schema.js';
import { booleanoQuery, idQuery } from './query.schema.js';

// GET /api/categorias?areaId=&activa=. Sin filtros devuelve todas (activas e inactivas).
export const categoriaQuerySchema = z.object({
  areaId: idQuery('areaId'),
  activa: booleanoQuery('activa'),
});

export type CategoriaQuery = z.infer<typeof categoriaQuerySchema>;

export const categoriaIdParamsSchema = z.object({ id: idPathParam('id') });

const nombreCategoria = z
  .string({ error: "El campo 'nombre' es obligatorio" })
  .trim()
  .min(2, 'El nombre debe tener entre 2 y 100 caracteres')
  .max(100, 'El nombre debe tener entre 2 y 100 caracteres');

// Vacío u omitido se guarda como null.
const descripcionCategoria = z
  .string({ error: "El campo 'descripcion' debe ser un texto" })
  .trim()
  .max(255, 'La descripción admite como máximo 255 caracteres')
  .nullish()
  .transform(valor => (valor ? valor : null));

// Un id de ruta o de cuerpo es un entero positivo dentro del rango de int4.
const areaIdBody = z
  .number({ error: "El campo 'areaId' es obligatorio y debe ser un número" })
  .int("El campo 'areaId' debe ser un entero")
  .positive("El campo 'areaId' debe ser mayor que cero")
  .max(MAX_ID_INT32, "El campo 'areaId' no corresponde a un registro existente");

// POST /api/categorias (HU-11).
export const crearCategoriaSchema = z.object({
  areaId: areaIdBody,
  nombre: nombreCategoria,
  descripcion: descripcionCategoria,
});

export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>;

// PUT /api/categorias/:id (HU-11). El área no se cambia: si hace falta, se crea otra.
export const editarCategoriaSchema = z.object({
  nombre: nombreCategoria,
  descripcion: descripcionCategoria,
});

export type EditarCategoriaInput = z.infer<typeof editarCategoriaSchema>;

// PATCH /api/categorias/:id/activa (HU-11).
export const cambiarActivaSchema = z.object({
  activa: z.boolean({ error: "El campo 'activa' es obligatorio y debe ser true o false" }),
});
