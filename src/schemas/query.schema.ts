import { z } from 'zod';
import { MAX_ID_INT32 } from '../constants.js';

// Validadores de query params que comparten varios endpoints. Los query params
// llegan siempre como texto, así que aquí se convierten antes de validar.
// El esquema interno también es optional(): el preprocess convierte el vacío en
// undefined y, si el interno no lo acepta, `?param=` respondería 400.

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
      z.boolean({ error: `El parámetro '${parametro}' debe ser true o false` }).optional(),
    )
    .optional();

// Uno o varios valores de un enum: `prioridad=P1,P2` o `prioridad=P1&prioridad=P2`
// (Express entrega el parámetro repetido como arreglo). Vacío u omitido queda
// como undefined (sin filtro). El error se reporta sobre el parámetro, no sobre
// la posición del valor inválido.
export const listaEnumQuery = <const Valores extends readonly string[]>(
  parametro: string,
  valores: Valores,
) => {
  const mensaje = `El parámetro '${parametro}' solo admite ${valores.slice(0, -1).join(', ')} o ${valores.at(-1)}`;

  return z
    .preprocess(
      valor => {
        if (valor === undefined) return undefined;
        const partes = (Array.isArray(valor) ? valor : [valor]).flatMap(parte =>
          typeof parte === 'string' ? parte.split(',') : [parte],
        );
        const lista = partes
          .map(parte => (typeof parte === 'string' ? parte.trim() : parte))
          .filter(parte => parte !== '');
        return lista.length === 0 ? undefined : lista;
      },
      z
        .array(z.string({ error: mensaje }))
        .transform((lista, ctx) => {
          if (lista.some(valor => !valores.includes(valor))) {
            ctx.addIssue({ code: 'custom', message: mensaje });
            return z.NEVER;
          }
          return lista as Valores[number][];
        })
        .optional(),
    )
    .optional();
};

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
        .max(MAX_ID_INT32, `El parámetro '${parametro}' excede el rango permitido`)
        .optional(),
    )
    .optional();
