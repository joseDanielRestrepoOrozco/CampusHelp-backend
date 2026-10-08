import { ConflictError, ForbiddenError, NotFoundError } from '../errors/app-error.js';
import { aCategoriaDto, type CategoriaDto } from '../dto/categoria.dto.js';
import type { AreasRepository } from '../repositories/areas.repository.js';
import type { CategoriasRepository } from '../repositories/categorias.repository.js';
import type { UsuarioAutenticado } from '../repositories/usuarios.repository.js';
import type {
  CategoriaQuery,
  CrearCategoriaInput,
  EditarCategoriaInput,
} from '../schemas/categoria.schema.js';

const MENSAJE_DUPLICADA = 'Ya existe una categoría con ese nombre en el área';

// Reglas de HU-11 (RN-03, RN-21, RN-22). Las escrituras son solo del administrador.
export class CategoriasService {
  constructor(
    private readonly categorias: CategoriasRepository,
    private readonly areas: AreasRepository,
  ) {}

  // GET /api/categorias: público. Cada categoría trae `totalCasos` para que el
  // front sepa si se puede borrar.
  async listar(filtros: CategoriaQuery): Promise<CategoriaDto[]> {
    const categorias = await this.categorias.listar(filtros);
    const totales = await this.categorias.contarCasosPorCategoria(categorias.map(c => c.id));

    return categorias.map(categoria => aCategoriaDto(categoria, totales.get(categoria.id) ?? 0));
  }

  // Orden de errores del contrato (docs/03-api.md): 401 → 400 → 404 → 403 → 409.
  // El 401 y el 400 ya se resolvieron en el middleware y el controlador.
  async crear(usuario: UsuarioAutenticado, input: CrearCategoriaInput): Promise<CategoriaDto> {
    if (!(await this.areas.buscarPorId(input.areaId))) {
      throw new NotFoundError('El área no existe');
    }

    this.exigirAdministrador(usuario);

    if (await this.categorias.buscarPorNombreEnArea(input.areaId, input.nombre)) {
      throw new ConflictError('CATEGORIA_DUPLICADA', MENSAJE_DUPLICADA);
    }

    return aCategoriaDto(await this.categorias.crear(input), 0);
  }

  async editar(
    usuario: UsuarioAutenticado,
    id: number,
    input: EditarCategoriaInput,
  ): Promise<CategoriaDto> {
    const existente = await this.obtener(id);
    this.exigirAdministrador(usuario);

    if (await this.categorias.buscarPorNombreEnArea(existente.areaId, input.nombre, id)) {
      throw new ConflictError('CATEGORIA_DUPLICADA', MENSAJE_DUPLICADA);
    }

    const actualizada = await this.categorias.actualizar(id, input);
    if (!actualizada) throw new NotFoundError('La categoría no existe');

    return aCategoriaDto(actualizada, await this.categorias.contarCasos(id));
  }

  // Desactivar no toca los casos que ya usaban la categoría (RN-21).
  async cambiarActiva(
    usuario: UsuarioAutenticado,
    id: number,
    activa: boolean,
  ): Promise<CategoriaDto> {
    await this.obtener(id);
    this.exigirAdministrador(usuario);

    const actualizada = await this.categorias.cambiarActiva(id, activa);
    if (!actualizada) throw new NotFoundError('La categoría no existe');

    return aCategoriaDto(actualizada, await this.categorias.contarCasos(id));
  }

  // RN-21: una categoría con casos nunca se borra, solo se desactiva.
  async eliminar(usuario: UsuarioAutenticado, id: number): Promise<void> {
    await this.obtener(id);
    this.exigirAdministrador(usuario);

    const totalCasos = await this.categorias.contarCasos(id);
    if (totalCasos > 0) {
      throw new ConflictError(
        'CATEGORIA_CON_CASOS',
        `Tiene ${totalCasos} casos; desactívala en vez de borrarla`,
      );
    }

    await this.categorias.eliminar(id);
  }

  private exigirAdministrador(usuario: UsuarioAutenticado): void {
    if (usuario.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenError(
        'ROL_NO_PERMITIDO',
        'Solo los administradores pueden gestionar categorías',
      );
    }
  }

  private async obtener(id: number) {
    const categoria = await this.categorias.buscarPorId(id);
    if (!categoria) throw new NotFoundError('La categoría no existe');
    return categoria;
  }
}
