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
}
