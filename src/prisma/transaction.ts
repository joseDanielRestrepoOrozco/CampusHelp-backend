import type { db } from './db.js';

// Contexto de transacción de Postgres (PostgresTransactionContext<Contract>),
// extraído de la propia firma de `db.transaction` para no depender de tipos internos.
export type TransactionContext = Parameters<Parameters<typeof db.transaction>[0]>[0];
