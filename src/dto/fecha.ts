// Postgres entrega el timestamptz como texto ("2026-10-01 23:51:28.277293+00"),
// que no es ISO 8601 UTC como exige el contrato (docs/03-api.md). Los null se
// respetan tal cual. Lo comparten los DTO con fechas.
export function aFechaIso(fecha: string): string;
export function aFechaIso(fecha: string | null): string | null;
export function aFechaIso(fecha: string | null): string | null {
  return fecha === null ? null : new Date(fecha).toISOString();
}
