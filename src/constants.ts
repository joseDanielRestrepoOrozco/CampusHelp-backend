// Límite del tipo `integer` de PostgreSQL (int4). Las columnas id del modelo son
// int4, así que un id mayor que esto hace fallar la consulta con SQLSTATE 22003
// en vez de devolver "no existe". Los ids se validan antes de tocar la base de datos.
export const MAX_ID_INT32 = 2_147_483_647;
