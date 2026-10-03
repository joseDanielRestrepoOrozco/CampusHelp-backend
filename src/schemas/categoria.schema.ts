import { z } from 'zod';
import { booleanoQuery, idQuery } from './query.schema.js';

// GET /api/categorias?areaId=&activa=. Sin filtros devuelve todas (activas e inactivas).
export const categoriaQuerySchema = z.object({
  areaId: idQuery('areaId'),
  activa: booleanoQuery('activa'),
});

export type CategoriaQuery = z.infer<typeof categoriaQuerySchema>;
