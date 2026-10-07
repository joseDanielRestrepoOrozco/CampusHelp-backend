#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/96aef95eb591dc199cc499a8534d51969988869beee6412c008d56672d4373ff/contract';
import endContract from '../../snapshots/96aef95eb591dc199cc499a8534d51969988869beee6412c008d56672d4373ff/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/eccce1460cf7d1e3e787d2544c944935a0a135acf8aecc6f758b57017cccdc78/contract';
import startContract from '../../snapshots/eccce1460cf7d1e3e787d2544c944935a0a135acf8aecc6f758b57017cccdc78/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createIndex({
        schema: 'public',
        table: 'caso',
        index: 'caso_prioridad_idx_86f496ef',
        columns: ['prioridad'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'caso',
        index: 'caso_tipo_idx_2cc2d1f4',
        columns: ['tipo'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
