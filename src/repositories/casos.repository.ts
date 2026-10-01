import { db } from '../prisma/db.js';
import type { ResultType } from '@prisma/orm-postgres/components/runtime';
import type { CreateCasoInput } from '../schemas/caso.schema.js';
import { AppError, ConflictError, ForbiddenError } from '../errors/app-error.js';
import { aCasoDto, type CasoDto } from '../dto/caso.dto.js';
import type { UsuarioAutenticado } from './usuarios.repository.js';
import { HistorialRepository } from './historial.repository.js';

// Consulta con las relaciones anidadas que exige el DTO (Caso de docs/03-api.md).
const consultaCasoConRelaciones = (id: number) =>
  db.orm.public.Caso.where({ id })
    .include('solicitante', usuario => usuario)
    .include('agente', usuario => usuario)
    .include('categoria', categoria => categoria.include('area', area => area));

export type CasoConRelaciones = ResultType<ReturnType<typeof consultaCasoConRelaciones>>;

export class CasosRepository {
  constructor(private readonly historial: HistorialRepository) {}

  // HU-01: registrar incidente o solicitud. Contiene las reglas del caso.
  async crearCaso(usuario: UsuarioAutenticado, input: CreateCasoInput): Promise<CasoDto> {
    if (usuario.rol !== 'SOLICITANTE') {
      throw new ForbiddenError('ROL_NO_PERMITIDO', 'Solo los solicitantes pueden registrar casos');
    }

    // RN-03: la categoría debe existir, estar activa y pertenecer al área enviada.
    const categoria = await db.orm.public.Categoria.where({
      id: input.categoriaId,
      activa: true,
      areaId: input.areaId,
    }).first();
    if (!categoria) {
      throw new ConflictError(
        'CATEGORIA_INVALIDA',
        'La categoría no existe, está inactiva o no pertenece al área indicada',
      );
    }

    // El área no se guarda en el caso: sale de la categoría (RN-03).
    const { areaId: _areaId, ...datosCaso } = input;

    // El caso y su evento de creación van en la misma transacción.
    const casoId = await db.transaction(async tx => {
      const creado = await tx.orm.public.Caso.create({
        ...datosCaso,
        estado: 'PENDIENTE',
        solicitanteId: usuario.id,
      });

      await this.historial.registrarEvento(tx, {
        casoId: creado.id,
        evento: 'CREACION',
        estadoAnterior: null,
        estadoNuevo: 'PENDIENTE',
        usuarioId: usuario.id,
        comentario: null,
      });

      return creado.id;
    });

    const conRelaciones = await consultaCasoConRelaciones(casoId).first();
    if (!conRelaciones) {
      throw new AppError(500, 'ERROR_INTERNO', 'El caso recién creado no se pudo leer');
    }

    return aCasoDto(conRelaciones);
  }
}
