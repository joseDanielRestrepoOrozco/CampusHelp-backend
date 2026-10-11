import { db } from '../prisma/db.js';
import type { AreaIndicadorDto } from '../dto/indicador.dto.js';

// Rango de `fechaCreacion`/`fecha` ya resuelto a ISO 8601 UTC. null = sin límite.
export interface RangoFechas {
  desde: string | null;
  hasta: string | null;
}

// Fechas sentinela que cubren todo el rango soportado por Postgres: permiten
// parametrizar los promedios sin interpolar null en la plantilla raw.
const FECHA_MINIMA = '0001-01-01T00:00:00.000Z';
const FECHA_MAXIMA = '9999-12-31T23:59:59.999Z';

// Solo acceso a datos (HU-10). Los conteos usan `groupBy`/`count` del ORM y los
// promedios se calculan en SQL con AVG, para no traer los casos a memoria.
export class IndicadoresRepository {
  private casosEnRango(rango: RangoFechas) {
    let query = db.orm.public.Caso;

    if (rango.desde !== null) {
      const desde = rango.desde;
      query = query.where(caso => caso.fechaCreacion.gte(desde));
    }
    if (rango.hasta !== null) {
      const hasta = rango.hasta;
      query = query.where(caso => caso.fechaCreacion.lte(hasta));
    }

    return query;
  }

  async contarTotal(rango: RangoFechas): Promise<number> {
    const fila = await this.casosEnRango(rango).aggregate(aggregate => ({
      total: aggregate.count(),
    }));
    return fila.total;
  }

  async contarPorEstado(rango: RangoFechas) {
    return this.casosEnRango(rango)
      .groupBy('estado')
      .aggregate(aggregate => ({ cantidad: aggregate.count() }));
  }

  async contarPorTipo(rango: RangoFechas) {
    return this.casosEnRango(rango)
      .groupBy('tipo')
      .aggregate(aggregate => ({ cantidad: aggregate.count() }));
  }

  async contarPorPrioridad(rango: RangoFechas) {
    return this.casosEnRango(rango)
      .groupBy('prioridad')
      .aggregate(aggregate => ({ cantidad: aggregate.count() }));
  }

  // El caso no guarda el área: sale de su categoría (RN-03). Los casos se
  // cuentan por categoría en una consulta y se suman por área en memoria; se
  // devuelven las cinco áreas aunque no tengan casos.
  async contarPorArea(rango: RangoFechas): Promise<AreaIndicadorDto[]> {
    const [areas, categorias, filas] = await Promise.all([
      db.orm.public.Area.select('id', 'nombre')
        .orderBy(area => area.id.asc())
        .all(),
      db.orm.public.Categoria.select('id', 'areaId').all(),
      this.casosEnRango(rango)
        .groupBy('categoriaId')
        .aggregate(aggregate => ({ cantidad: aggregate.count() })),
    ]);

    const areaDeCategoria = new Map(categorias.map(categoria => [categoria.id, categoria.areaId]));
    const cantidadPorArea = new Map<number, number>();

    for (const fila of filas) {
      const areaId = areaDeCategoria.get(fila.categoriaId);
      if (areaId === undefined) continue;
      cantidadPorArea.set(areaId, (cantidadPorArea.get(areaId) ?? 0) + fila.cantidad);
    }

    return areas.map(area => ({
      areaId: area.id,
      area: area.nombre,
      cantidad: cantidadPorArea.get(area.id) ?? 0,
    }));
  }

  // AVG ignora los null, así que los casos sin `fechaAsignacion` no cuentan; si
  // no queda ninguno, AVG devuelve null. Se parametrizan los límites con fechas
  // sentinela para no interpolar null en la plantilla.
  async promedioHorasHastaAsignacion(rango: RangoFechas): Promise<number | null> {
    const plan = db.raw.sql`
      SELECT AVG((EXTRACT(EPOCH FROM (fecha_asignacion - fecha_creacion)) / 3600.0)::float8) AS horas
      FROM caso
      WHERE fecha_creacion >= ${rango.desde ?? FECHA_MINIMA}::timestamptz
        AND fecha_creacion <= ${rango.hasta ?? FECHA_MAXIMA}::timestamptz
    `
      .returnsRow({ horas: { codecId: 'pg/float8@1', nullable: true } })
      .build();

    const [fila] = await db.runtime().query(plan);
    return fila?.horas ?? null;
  }

  // Solo los casos CERRADA (RN-14), que son los que tienen `fechaCierre`.
  async promedioHorasResolucion(rango: RangoFechas): Promise<number | null> {
    const plan = db.raw.sql`
      SELECT AVG((EXTRACT(EPOCH FROM (fecha_cierre - fecha_creacion)) / 3600.0)::float8) AS horas
      FROM caso
      WHERE estado = 'CERRADA'
        AND fecha_creacion >= ${rango.desde ?? FECHA_MINIMA}::timestamptz
        AND fecha_creacion <= ${rango.hasta ?? FECHA_MAXIMA}::timestamptz
    `
      .returnsRow({ horas: { codecId: 'pg/float8@1', nullable: true } })
      .build();

    const [fila] = await db.runtime().query(plan);
    return fila?.horas ?? null;
  }

  // Devoluciones por la fecha del propio evento de historial (decisión del PR).
  async contarDevoluciones(rango: RangoFechas): Promise<number> {
    let query = db.orm.public.Historial.where({ evento: 'DEVOLUCION' });

    if (rango.desde !== null) {
      const desde = rango.desde;
      query = query.where(historial => historial.fecha.gte(desde));
    }
    if (rango.hasta !== null) {
      const hasta = rango.hasta;
      query = query.where(historial => historial.fecha.lte(hasta));
    }

    const fila = await query.aggregate(aggregate => ({ total: aggregate.count() }));
    return fila.total;
  }
}
