import { z } from 'zod';
import { MAX_ID_INT32 } from '../constants.js';

// Validadores de parámetros de ruta (`/casos/:id`). Express los entrega como
// texto, así que se convierten antes de validar con el mismo rango int4 del
// resto de ids: un id enorme o no numérico responde 400 y no hace fallar la
// consulta con 500.
export const idPathParam = (parametro: string) =>
  z.preprocess(
    valor => (typeof valor === 'string' && /^\d+$/.test(valor) ? Number(valor) : valor),
    z
      .number({ error: `El parámetro '${parametro}' debe ser un número` })
      .int(`El parámetro '${parametro}' debe ser un entero`)
      .positive(`El parámetro '${parametro}' debe ser mayor que cero`)
      .max(MAX_ID_INT32, `El parámetro '${parametro}' excede el rango permitido`),
  );
