import { AppError, ConflictError, ForbiddenError } from '../errors/app-error.js';
import { aCasoDto, type CasoDto } from '../dto/caso.dto.js';
import type { CreateCasoInput, ListarCasosQuery } from '../schemas/caso.schema.js';
import type { CasosRepository } from '../repositories/casos.repository.js';
import type { UsuarioAutenticado } from '../repositories/usuarios.repository.js';

// Capa de servicio: aquí viven las reglas de negocio del registro de casos,
// no en el controlador ni en el repositorio.
export class CasosService {
  constructor(private readonly casos: CasosRepository) {}

  // HU-01: registrar incidente o solicitud.
  async registrarCaso(usuario: UsuarioAutenticado, input: CreateCasoInput): Promise<CasoDto> {
    // Solo los solicitantes registran casos.
    if (usuario.rol !== 'SOLICITANTE') {
      throw new ForbiddenError('ROL_NO_PERMITIDO', 'Solo los solicitantes pueden registrar casos');
    }

    // RN-03: la categoría debe existir, estar activa y pertenecer al área enviada.
    const categoria = await this.casos.buscarCategoriaActivaDeArea(input.categoriaId, input.areaId);
    if (!categoria) {
      throw new ConflictError(
        'CATEGORIA_INVALIDA',
        'La categoría no existe, está inactiva o no pertenece al área indicada',
      );
    }

    // El área no se guarda en el caso: sale de la categoría (RN-03).
    const { areaId: _areaId, ...datosCaso } = input;

    const casoId = await this.casos.crearCaso(datosCaso, usuario.id);

    const caso = await this.casos.buscarPorId(casoId);
    if (!caso) {
      throw new AppError(500, 'ERROR_INTERNO', 'El caso recién creado no se pudo leer');
    }

    return aCasoDto(caso);
  }

  // HU-02 / HU-03: consultar casos y bandeja de trabajo.
  async listarCasos(usuario: UsuarioAutenticado, query: ListarCasosQuery): Promise<CasoDto[]> {
    // RN-20: un solicitante solo ve sus propios casos, aunque pida los de otro.
    // Los demás roles ven todos y pueden filtrar por solicitante.
    const solicitanteId = usuario.rol === 'SOLICITANTE' ? usuario.id : query.solicitanteId;

    const casos = await this.casos.listar({
      solicitanteId,
      agenteId: query.agenteId,
      abiertos: query.abiertos,
      sinAgente: query.sinAgente,
      orden: query.orden,
    });
    return casos.map(aCasoDto);
  }
}
