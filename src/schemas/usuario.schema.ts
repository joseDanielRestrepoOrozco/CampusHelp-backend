import { z } from 'zod';

export const rolSchema = z.enum(['SOLICITANTE', 'AGENTE', 'VALIDADOR', 'ADMINISTRADOR'], {
  error: "El parámetro 'rol' debe ser SOLICITANTE, AGENTE, VALIDADOR o ADMINISTRADOR",
});

// GET /api/usuarios. Siempre devuelve solo activos, por eso no hay filtro `activo`.
export const usuarioQuerySchema = z.object({
  rol: rolSchema.optional(),
});

export type UsuarioQuery = z.infer<typeof usuarioQuerySchema>;
