import { ForbiddenError } from '../errors/app-error.js';
import type { IndicadorDto } from '../dto/indicador.dto.js';
import { estadoCasoSchema, prioridadSchema, tipoCasoSchema } from '../schemas/caso.schema.js';
import type { IndicadoresQuery } from '../schemas/indicador.schema.js';
import type { IndicadoresRepository, RangoFechas } from '../repositories/indicadores.repository.js';
import type { UsuarioAutenticado } from '../repositories/usuarios.repository.js';

// Convierte las fechas sin hora del query en el rango ISO UTC que filtra por
// `fechaCreacion`, incluyendo ambos días.
function aRangoFechas(desde?: string, hasta?: string): RangoFechas {
  return {
    desde: desde === undefined ? null : `${desde}T00:00:00.000Z`,
    hasta: hasta === undefined ? null : `${hasta}T23:59:59.999Z`,
  };
}

// Arma el objeto con TODAS las llaves del enum, en 0 las que no aparezcan.
function aConteo<Clave extends string>(
  llaves: readonly Clave[],
  filas: ReadonlyArray<{ clave: Clave; cantidad: number }>,
): Record<Clave, number> {
  const conteo = Object.fromEntries(llaves.map(llave => [llave, 0])) as Record<Clave, number>;

  for (const fila of filas) {
    conteo[fila.clave] += fila.cantidad;
  }

  return conteo;
}

// Los promedios se exponen con un decimal; null se conserva.
function redondear(valor: number | null): number | null {
  return valor === null ? null : Math.round(valor * 10) / 10;
}

// Reglas de HU-10: los indicadores se calculan sobre los casos reales y solo los
// consulta el administrador.
export class IndicadoresService {
  constructor(private readonly indicadores: IndicadoresRepository) {}

  async obtener(usuario: UsuarioAutenticado, query: IndicadoresQuery): Promise<IndicadorDto> {
    this.exigirAdministrador(usuario);

    const rango = aRangoFechas(query.desde, query.hasta);

    const [
      total,
      porEstadoFilas,
      porTipoFilas,
      porPrioridadFilas,
      porArea,
      horasHastaAsignacion,
      horasResolucion,
      devoluciones,
    ] = await Promise.all([
      this.indicadores.contarTotal(rango),
      this.indicadores.contarPorEstado(rango),
      this.indicadores.contarPorTipo(rango),
      this.indicadores.contarPorPrioridad(rango),
      this.indicadores.contarPorArea(rango),
      this.indicadores.promedioHorasHastaAsignacion(rango),
      this.indicadores.promedioHorasResolucion(rango),
      this.indicadores.contarDevoluciones(rango),
    ]);

    return {
      total,
      porEstado: aConteo(
        estadoCasoSchema.options,
        porEstadoFilas.map(fila => ({ clave: fila.estado, cantidad: fila.cantidad })),
      ),
      porTipo: aConteo(
        tipoCasoSchema.options,
        porTipoFilas.map(fila => ({ clave: fila.tipo, cantidad: fila.cantidad })),
      ),
      porPrioridad: aConteo(
        prioridadSchema.options,
        porPrioridadFilas.map(fila => ({ clave: fila.prioridad, cantidad: fila.cantidad })),
      ),
      porArea,
      promedioHorasHastaAsignacion: redondear(horasHastaAsignacion),
      promedioHorasResolucion: redondear(horasResolucion),
      devoluciones,
    };
  }

  private exigirAdministrador(usuario: UsuarioAutenticado): void {
    if (usuario.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenError(
        'ROL_NO_PERMITIDO',
        'Solo los administradores pueden consultar los indicadores',
      );
    }
  }
}
