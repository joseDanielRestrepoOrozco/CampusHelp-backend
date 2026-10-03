import { z } from 'zod';
import { MAX_ID_INT32 } from '../constants.js';

// Validadores de query params que comparten varios endpoints. Los query params
// llegan siempre como texto, así que aquí se convierten antes de validar.

// "true" / "false". Vacío u omitido queda como undefined (sin filtro).
export const booleanoQuery = (parametro: string) =>
  z
    .preprocess(
      valor => {
        if (valor === undefined || valor === '') return undefined;
        if (valor === 'true') return true;
        if (valor === 'false') return false;
        return valor;
      },
      z.boolean({ error: `El parámetro '${parametro}' debe ser true o false` }),
    )
    .optional();

// Id de otra tabla: entero positivo dentro del rango de int4 de Postgres, para
// que un id gigante responda 400 y no haga fallar la consulta con 500.
export const idQuery = (parametro: string) =>
  z
    .preprocess(
      valor => (valor === undefined || valor === '' ? undefined : Number(valor)),
      z
        .number({ error: `El parámetro '${parametro}' debe ser un número` })
        .int(`El parámetro '${parametro}' debe ser un entero`)
        .positive(`El parámetro '${parametro}' debe ser mayor que cero`)
        .max(MAX_ID_INT32, `El parámetro '${parametro}' excede el rango permitido`),
    )
    .optional();
