import { z } from 'zod';

// Query params de GET /api/indicadores (HU-10). `desde` y `hasta` son fechas sin
// hora (YYYY-MM-DD) que filtran por `fechaCreacion`, incluyendo ambos días.
// Se validan aquí para responder 400 VALIDACION antes de tocar la base de datos.

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// El formato no basta: descarta fechas inexistentes (p. ej. 2026-02-30).
function esFechaReal(texto: string): boolean {
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  );
}

// Vacío u omitido queda como undefined (sin filtro). Un valor repetido llega
// como arreglo y no pasa la validación de texto, igual que en el resto de la API.
const fechaQuery = (parametro: string) =>
  z
    .preprocess(
      valor => {
        if (typeof valor !== 'string') return valor;
        const texto = valor.trim();
        return texto === '' ? undefined : texto;
      },
      z
        .string({ error: `El parámetro '${parametro}' debe ser una fecha YYYY-MM-DD` })
        .refine(
          texto => FORMATO_FECHA.test(texto) && esFechaReal(texto),
          `El parámetro '${parametro}' debe ser una fecha válida con formato YYYY-MM-DD`,
        )
        .optional(),
    )
    .optional();

export const indicadoresQuerySchema = z
  .object({
    desde: fechaQuery('desde'),
    hasta: fechaQuery('hasta'),
  })
  .superRefine((query, ctx) => {
    // Al ser YYYY-MM-DD, el orden lexicográfico coincide con el cronológico.
    if (query.desde && query.hasta && query.desde > query.hasta) {
      ctx.addIssue({
        code: 'custom',
        path: ['hasta'],
        message: "El parámetro 'hasta' no puede ser anterior al parámetro 'desde'",
      });
    }
  });

export type IndicadoresQuery = z.infer<typeof indicadoresQuerySchema>;
