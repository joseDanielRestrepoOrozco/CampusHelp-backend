import { db } from '../prisma/db.js';
import type { ResultType } from '@prisma/orm-postgres/components/runtime';
import { ConflictError } from '../errors/app-error.js';
import type { EstadoCaso } from '../domain/estados.js';
import type { HistorialRepository } from './historial.repository.js';

// La atención con el agente que la registró (solo id y nombre, como pide el DTO).
const atencionConAgente = () =>
  db.orm.public.Atencion.include('agente', usuario => usuario.select('id', 'nombre'));

const consultaAtencion = (id: number) => atencionConAgente().where({ id });

export type AtencionConAgente = ResultType<ReturnType<typeof consultaAtencion>>;

// HU-06: un caso puede tener varias atenciones (una nueva por cada devolución);
// la más reciente es la "vigente" que consumen HU-07 y HU-12.
export class AtencionesRepository {
  constructor(private readonly historial: HistorialRepository) {}

  // RN-17: la atención y el evento ATENCION se escriben en la misma transacción.
  // El `where` exige que el caso siga en `estadoActual` y asignado al mismo
  // agente: si otra petición lo movió, no se crea nada y se responde 409.
  async registrarAtencion(
    casoId: number,
    agenteId: number,
    diagnostico: string,
    solucion: string,
    estadoActual: EstadoCaso,
  ): Promise<number> {
    return db.transaction(async tx => {
      const caso = await tx.orm.public.Caso.where({
        id: casoId,
        estado: estadoActual,
        agenteId,
      }).first();

      if (!caso) {
        throw new ConflictError(
          'ESTADO_NO_PERMITE_OPERACION',
          'El caso cambió mientras se procesaba la petición; inténtalo de nuevo',
        );
      }

      const creada = await tx.orm.public.Atencion.create({
        casoId,
        agenteId,
        diagnostico,
        solucion,
      });

      await this.historial.registrarEvento(tx, {
        casoId,
        evento: 'ATENCION',
        estadoAnterior: estadoActual,
        estadoNuevo: estadoActual,
        usuarioId: agenteId,
        comentario: null,
      });

      return creada.id;
    });
  }

  async buscarPorId(id: number): Promise<AtencionConAgente | null> {
    return consultaAtencion(id).first();
  }

  // HU-06/HU-07/HU-12: la atención más reciente del caso (la que cuenta como
  // solución vigente). El id desempata atenciones del mismo instante.
  async atencionVigente(casoId: number): Promise<AtencionConAgente | null> {
    return atencionConAgente()
      .where({ casoId })
      .orderBy([atencion => atencion.fecha.desc(), atencion => atencion.id.desc()])
      .first();
  }
}
