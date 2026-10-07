import { db } from '../prisma/db.js';
import type { ResultType } from '@prisma/orm-postgres/components/runtime';
import type { Models } from '../prisma/contract.js';
import type { TransactionContext } from '../prisma/transaction.js';

export interface RegistrarEventoData {
  casoId: number;
  evento: Models.public_Historial['evento'];
  estadoAnterior: Models.public_Historial['estadoAnterior'];
  estadoNuevo: Models.public_Historial['estadoNuevo'];
  usuarioId: number;
  comentario?: string | null;
}

// HU-08: el evento con el usuario que lo generó. Solo id, nombre y rol, que es
// lo que pide el contrato; el correo y el activo no se exponen.
const historialConUsuario = () =>
  db.orm.public.Historial.include('usuario', usuario => usuario.select('id', 'nombre', 'rol'));

const consultaHistorialDeCaso = (casoId: number) => historialConUsuario().where({ casoId });

export type HistorialConUsuario = ResultType<ReturnType<typeof consultaHistorialDeCaso>>;

export class HistorialRepository {
  // RN-17: registra un evento del historial dentro de la transacción recibida.
  // Lo usan todos los endpoints que cambian un caso.
  async registrarEvento(tx: TransactionContext, data: RegistrarEventoData): Promise<void> {
    await tx.orm.public.Historial.create({
      casoId: data.casoId,
      evento: data.evento,
      estadoAnterior: data.estadoAnterior,
      estadoNuevo: data.estadoNuevo,
      usuarioId: data.usuarioId,
      comentario: data.comentario ?? null,
    });
  }

  // HU-08: historial de un caso en orden cronológico ascendente (el más viejo
  // primero). El id desempata eventos escritos en el mismo instante.
  async listarPorCaso(casoId: number): Promise<HistorialConUsuario[]> {
    return consultaHistorialDeCaso(casoId)
      .orderBy([evento => evento.fecha.asc(), evento => evento.id.asc()])
      .all();
  }

  // RN-13: la última devolución del caso, si la hay. La atención vigente debe ser
  // posterior a ella para que el caso pueda volver a validación (HU-06/HU-07).
  async ultimaDevolucion(casoId: number): Promise<HistorialConUsuario | null> {
    return consultaHistorialDeCaso(casoId)
      .where({ evento: 'DEVOLUCION' })
      .orderBy([evento => evento.fecha.desc(), evento => evento.id.desc()])
      .first();
  }
}
