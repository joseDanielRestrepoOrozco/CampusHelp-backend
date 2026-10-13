import type { EstadoCaso } from '../domain/estados.js';
import type { Models } from '../prisma/contract.js';

export type TipoCasoIndicador = Models.public_Caso['tipo'];
export type PrioridadIndicador = Models.public_Caso['prioridad'];

// Una fila de `porArea` (HU-10). Se incluyen las cinco áreas, con cantidad 0 si
// no tienen casos en el rango.
export interface AreaIndicadorDto {
  areaId: number;
  area: string;
  cantidad: number;
}

// Respuesta de GET /api/indicadores (docs/03-api.md, sección GET /indicadores).
// Los promedios son null cuando no hay casos asignados o cerrados en el rango.
export interface IndicadorDto {
  total: number;
  porEstado: Record<EstadoCaso, number>;
  porTipo: Record<TipoCasoIndicador, number>;
  porPrioridad: Record<PrioridadIndicador, number>;
  porArea: AreaIndicadorDto[];
  promedioHorasHastaAsignacion: number | null;
  promedioHorasResolucion: number | null;
  devoluciones: number;
}
