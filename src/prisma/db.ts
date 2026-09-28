import postgres from '@prisma/orm-postgres/runtime';
import { env } from '../config/env.js';
import type { Contract } from './contract.js';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: env.databaseUrl,
});
