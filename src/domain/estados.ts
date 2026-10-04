import type { z } from 'zod';
import { ConflictError } from '../errors/app-error.js';
import { estadoCasoSchema } from '../schemas/caso.schema.js';

// La tabla de transiciones del caso vive únicamente aquí (RN-09). HU-04, HU-06,
// HU-07 y HU-08 la reutilizan: no se copia en ningún otro archivo.
export type EstadoCaso = z.infer<typeof estadoCasoSchema>;

// Quién pide el cambio. `validacion` es el flujo del validador (#33); `manual`
// es el resto de endpoints, incluido PATCH /casos/:id/estado.
export type OrigenTransicion = 'manual' | 'validacion';

export interface Transicion {
  desde: EstadoCaso;
  hacia: EstadoCaso;
  origen: OrigenTransicion;
}

export const TRANSICIONES: readonly Transicion[] = [
  { desde: 'PENDIENTE', hacia: 'EN_ANALISIS', origen: 'manual' },
  { desde: 'EN_ANALISIS', hacia: 'EN_ATENCION', origen: 'manual' },
  { desde: 'EN_ATENCION', hacia: 'EN_VALIDACION', origen: 'manual' },
  // Las dos de validación solo las decide el validador (#33).
  { desde: 'EN_VALIDACION', hacia: 'EN_ATENCION', origen: 'validacion' },
  { desde: 'EN_VALIDACION', hacia: 'CERRADA', origen: 'validacion' },
];

const clave = (desde: EstadoCaso, hacia: EstadoCaso, origen: OrigenTransicion) =>
  `${desde}>${hacia}:${origen}`;

// Índice de la tabla para no recorrerla en cada petición.
const TRANSICIONES_PERMITIDAS = new Set(
  TRANSICIONES.map(transicion => clave(transicion.desde, transicion.hacia, transicion.origen)),
);

// Lo mínimo del caso que la regla necesita. El caso completo de Prisma cumple
// esta forma, así que los endpoints pueden pasar el que ya leyeron.
export interface CasoParaTransicionar {
  estado: EstadoCaso;
}

// TODO(#25): exigir que el caso tenga agente asignado antes de entrar a
// EN_ATENCION. Cuando se implemente, este tipo llevará también el agente:
// `if (!caso.agenteId) throw new ConflictError('SIN_AGENTE_ASIGNADO', '...')`.
export function verificarAgenteAsignado(_caso: CasoParaTransicionar): void {
  // Sin regla todavía: la transición pasa si está en la tabla (fuera de alcance).
}

// TODO(#29): exigir solución registrada antes de entrar a EN_VALIDACION. Esta
// regla necesita consultar la atención vigente del caso:
// `if (!atencion) throw new ConflictError('SIN_SOLUCION', '...')`.
export function verificarSolucionRegistrada(_caso: CasoParaTransicionar): void {
  // Sin regla todavía: la transición pasa si está en la tabla (fuera de alcance).
}

// Única puerta de las reglas de estado: la usan PATCH /casos/:id/estado (#18),
// la asignación (#25), la atención (#29) y la validación (#33).
export function validarTransicion(
  caso: CasoParaTransicionar,
  estadoNuevo: EstadoCaso,
  origen: OrigenTransicion,
): void {
  // RN-10: cerrada es un estado final. Se comprueba primero para que pedir un
  // cambio sobre un caso cerrado responda siempre CASO_CERRADO.
  if (caso.estado === 'CERRADA') {
    throw new ConflictError(
      'CASO_CERRADO',
      'El caso está cerrado y no admite más cambios de estado',
    );
  }

  // RN-14: un caso solo se cierra al aprobarlo en validación, nunca desde una
  // ruta manual como PATCH /casos/:id/estado.
  if (estadoNuevo === 'CERRADA' && origen === 'manual') {
    throw new ConflictError(
      'TRANSICION_INVALIDA',
      'Un caso solo se cierra al aprobarlo en validación',
    );
  }

  // RN-09: solo los pares de la tabla y solo desde el origen que la declara.
  // Aquí caen los saltos, los retrocesos, el mismo estado y salir de
  // EN_VALIDACION por una ruta manual.
  if (!TRANSICIONES_PERMITIDAS.has(clave(caso.estado, estadoNuevo, origen))) {
    throw new ConflictError(
      'TRANSICION_INVALIDA',
      `No se puede pasar un caso de ${caso.estado} a ${estadoNuevo}`,
    );
  }

  if (estadoNuevo === 'EN_ATENCION') {
    verificarAgenteAsignado(caso);
  }

  if (estadoNuevo === 'EN_VALIDACION') {
    verificarSolucionRegistrada(caso);
  }
}
