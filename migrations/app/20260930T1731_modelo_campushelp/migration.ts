#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/91e7f9f035806fa2789a4d726ef7724cad434fd6b00014d47ebf12d6e6bb784e/contract';
import startContract from '../../snapshots/91e7f9f035806fa2789a4d726ef7724cad434fd6b00014d47ebf12d6e6bb784e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/eccce1460cf7d1e3e787d2544c944935a0a135acf8aecc6f758b57017cccdc78/contract';
import endContract from '../../snapshots/eccce1460cf7d1e3e787d2544c944935a0a135acf8aecc6f758b57017cccdc78/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'Post' }),
      this.dropTable({ schema: 'public', table: 'User' }),
      this.createTable({
        schema: 'public',
        table: 'area',
        columns: [
          col('activa', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('descripcion', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nombre', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'atencion',
        columns: [
          col('agente_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('caso_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('diagnostico', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fecha', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('solucion', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'caso',
        columns: [
          col('agente_id', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('categoria_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('descripcion', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('estado', 'text', {
            notNull: true,
            default: lit('PENDIENTE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('fecha_asignacion', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('fecha_cierre', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('fecha_creacion', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('prioridad', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tipo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('titulo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('usuario_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'caso_estado_check_ce88b551',
            "\"estado\" IN ('PENDIENTE', 'EN_ANALISIS', 'EN_ATENCION', 'EN_VALIDACION', 'CERRADA')",
          ),
          checkExpression('caso_prioridad_check_c2c1af30', "\"prioridad\" IN ('P1', 'P2', 'P3')"),
          checkExpression('caso_tipo_check_81fc72ae', "\"tipo\" IN ('INCIDENTE', 'SOLICITUD')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'categoria',
        columns: [
          col('activa', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('area_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('descripcion', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nombre', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'historial',
        columns: [
          col('caso_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('comentario', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('estado_anterior', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('estado_nuevo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('evento', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fecha', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('usuario_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'historial_estado_anterior_check_11b7349e',
            "\"estado_anterior\" IN ('PENDIENTE', 'EN_ANALISIS', 'EN_ATENCION', 'EN_VALIDACION', 'CERRADA')",
          ),
          checkExpression(
            'historial_estado_nuevo_check_9c1435d6',
            "\"estado_nuevo\" IN ('PENDIENTE', 'EN_ANALISIS', 'EN_ATENCION', 'EN_VALIDACION', 'CERRADA')",
          ),
          checkExpression(
            'historial_evento_check_d99bc0fe',
            "\"evento\" IN ('CREACION', 'RECLASIFICACION', 'ASIGNACION', 'CAMBIO_ESTADO', 'ATENCION', 'APROBACION', 'DEVOLUCION')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'usuario',
        columns: [
          col('activo', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('correo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nombre', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rol', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'usuario_rol_check_55a43367',
            "\"rol\" IN ('SOLICITANTE', 'AGENTE', 'VALIDADOR', 'ADMINISTRADOR')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'area',
        constraint: 'area_nombre_key',
        columns: ['nombre'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'categoria',
        constraint: 'categoria_area_id_nombre_key',
        columns: ['area_id', 'nombre'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'usuario',
        constraint: 'usuario_correo_key',
        columns: ['correo'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'atencion',
        index: 'atencion_agente_id_idx_2dfdd41f',
        columns: ['agente_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'atencion',
        index: 'atencion_caso_id_idx_75e3250f',
        columns: ['caso_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'caso',
        index: 'caso_agente_id_idx_2dfdd41f',
        columns: ['agente_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'caso',
        index: 'caso_categoria_id_idx_6ad70c39',
        columns: ['categoria_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'caso',
        index: 'caso_estado_idx_c74e5888',
        columns: ['estado'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'caso',
        index: 'caso_usuario_id_idx_65b6616a',
        columns: ['usuario_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'categoria',
        index: 'categoria_area_id_idx_106c7330',
        columns: ['area_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'historial',
        index: 'historial_caso_id_idx_75e3250f',
        columns: ['caso_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'historial',
        index: 'historial_usuario_id_idx_65b6616a',
        columns: ['usuario_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'atencion',
        foreignKey: {
          name: 'atencion_caso_id_fkey',
          columns: ['caso_id'],
          references: { schema: 'public', table: 'caso', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'atencion',
        foreignKey: {
          name: 'atencion_agente_id_fkey',
          columns: ['agente_id'],
          references: { schema: 'public', table: 'usuario', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'caso',
        foreignKey: {
          name: 'caso_usuario_id_fkey',
          columns: ['usuario_id'],
          references: { schema: 'public', table: 'usuario', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'caso',
        foreignKey: {
          name: 'caso_categoria_id_fkey',
          columns: ['categoria_id'],
          references: { schema: 'public', table: 'categoria', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'caso',
        foreignKey: {
          name: 'caso_agente_id_fkey',
          columns: ['agente_id'],
          references: { schema: 'public', table: 'usuario', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'categoria',
        foreignKey: {
          name: 'categoria_area_id_fkey',
          columns: ['area_id'],
          references: { schema: 'public', table: 'area', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'historial',
        foreignKey: {
          name: 'historial_caso_id_fkey',
          columns: ['caso_id'],
          references: { schema: 'public', table: 'caso', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'historial',
        foreignKey: {
          name: 'historial_usuario_id_fkey',
          columns: ['usuario_id'],
          references: { schema: 'public', table: 'usuario', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
