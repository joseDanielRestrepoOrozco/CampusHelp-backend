export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: 'SOLICITANTE' | 'AGENTE' | 'VALIDADOR' | 'ADMINISTRADOR';
  activo: boolean;
}

export interface Area {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

export interface Categoria {
  id: number;
  areaId: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

export interface Atencion {
  id: number;
  casoId: number;
  diagnostico: string;
  solucion: string;
  fecha: string;
  agenteId: number;
  agente?: { id: number; nombre: string };
}

export interface HistorialItem {
  id: number;
  casoId: number;
  evento:
    | 'CREACION'
    | 'RECLASIFICACION'
    | 'ASIGNACION'
    | 'CAMBIO_ESTADO'
    | 'ATENCION'
    | 'APROBACION'
    | 'DEVOLUCION';
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  usuario: { id: number; nombre: string };
  fecha: string;
  comentario: string | null;
}

export interface Caso {
  id: number;
  tipo: 'INCIDENTE' | 'SOLICITUD';
  titulo: string;
  descripcion: string;
  prioridad: 'P1' | 'P2' | 'P3';
  estado: 'PENDIENTE' | 'EN_ANALISIS' | 'EN_ATENCION' | 'EN_VALIDACION' | 'CERRADA';
  solicitante: { id: number; nombre: string };
  agente: { id: number; nombre: string } | null;
  categoria: { id: number; nombre: string };
  area: { id: number; nombre: string };
  fechaCreacion: string;
  fechaAsignacion: string | null;
  fechaCierre: string | null;
  atenciones?: Atencion[];
}

export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 1,
    nombre: 'Laura Méndez',
    correo: 'laura.mendez@campushelp.test',
    rol: 'SOLICITANTE',
    activo: true,
  },
  {
    id: 2,
    nombre: 'Carlos Ruiz',
    correo: 'carlos.ruiz@campushelp.test',
    rol: 'SOLICITANTE',
    activo: true,
  },
  {
    id: 3,
    nombre: 'Andrés Pérez',
    correo: 'andres.perez@campushelp.test',
    rol: 'AGENTE',
    activo: true,
  },
  {
    id: 4,
    nombre: 'Marta Gómez',
    correo: 'marta.gomez@campushelp.test',
    rol: 'AGENTE',
    activo: true,
  },
  {
    id: 5,
    nombre: 'Sofía Rojas',
    correo: 'sofia.rojas@campushelp.test',
    rol: 'VALIDADOR',
    activo: true,
  },
  {
    id: 6,
    nombre: 'Admin TI',
    correo: 'admin@campushelp.test',
    rol: 'ADMINISTRADOR',
    activo: true,
  },
  {
    id: 7,
    nombre: 'Pedro Salas',
    correo: 'pedro.salas@campushelp.test',
    rol: 'AGENTE',
    activo: false,
  },
];

export const INITIAL_AREAS: Area[] = [
  { id: 1, nombre: 'Hardware', descripcion: 'Equipos físicos y periféricos', activa: true },
  {
    id: 2,
    nombre: 'Software',
    descripcion: 'Sistemas operativos y programas institucionales',
    activa: true,
  },
  {
    id: 3,
    nombre: 'Red y conectividad',
    descripcion: 'Conectividad cableada e inalámbrica',
    activa: true,
  },
  {
    id: 4,
    nombre: 'Cuentas y acceso',
    descripcion: 'Gestión de cuentas institucionales y permisos',
    activa: true,
  },
  {
    id: 5,
    nombre: 'Plataformas académicas',
    descripcion: 'Sistemas de apoyo a la docencia y gestión académica',
    activa: true,
  },
];

export const INITIAL_CATEGORIAS: Categoria[] = [
  {
    id: 1,
    areaId: 1,
    nombre: 'Computador',
    descripcion: 'Problemas con torre, portátil o todo en uno',
    activa: true,
  },
  {
    id: 2,
    areaId: 1,
    nombre: 'Periférico',
    descripcion: 'Teclado, mouse u otros dispositivos',
    activa: true,
  },
  {
    id: 3,
    areaId: 1,
    nombre: 'Proyector',
    descripcion: 'Fallas de video o audio en salas',
    activa: true,
  },
  {
    id: 4,
    areaId: 1,
    nombre: 'Impresora',
    descripcion: 'Impresoras institucionales y atascos',
    activa: true,
  },

  {
    id: 5,
    areaId: 2,
    nombre: 'Instalación',
    descripcion: 'Instalación de software institucional autorizado',
    activa: true,
  },
  {
    id: 6,
    areaId: 2,
    nombre: 'Error de aplicación',
    descripcion: 'Errores en ejecución o fallas de programas',
    activa: true,
  },
  {
    id: 7,
    areaId: 2,
    nombre: 'Actualización',
    descripcion: 'Actualizaciones de paquetes y programas',
    activa: true,
  },

  { id: 8, areaId: 3, nombre: 'Wi-Fi', descripcion: 'Red inalámbrica institucional', activa: true },
  {
    id: 9,
    areaId: 3,
    nombre: 'Internet',
    descripcion: 'Salida general a Internet y navegación',
    activa: true,
  },
  {
    id: 10,
    areaId: 3,
    nombre: 'Red cableada',
    descripcion: 'Tomas de red y puertos Ethernet',
    activa: true,
  },

  {
    id: 11,
    areaId: 4,
    nombre: 'Contraseña',
    descripcion: 'Restablecimiento y cambio de clave institucional',
    activa: true,
  },
  {
    id: 12,
    areaId: 4,
    nombre: 'Bloqueo de cuenta',
    descripcion: 'Desbloqueo de cuentas por intentos fallidos',
    activa: true,
  },
  {
    id: 13,
    areaId: 4,
    nombre: 'Correo institucional',
    descripcion: 'Buzón institucional y envío/recepción',
    activa: true,
  },
  {
    id: 14,
    areaId: 4,
    nombre: 'Permisos',
    descripcion: 'Asignación de roles y permisos a recursos',
    activa: true,
  },

  {
    id: 15,
    areaId: 5,
    nombre: 'Campus virtual',
    descripcion: 'Plataforma Moodle o campus en línea',
    activa: true,
  },
  {
    id: 16,
    areaId: 5,
    nombre: 'Sistema académico',
    descripcion: 'Portal de notas, matrículas y registros',
    activa: true,
  },
];

export const INITIAL_CASOS: Caso[] = [
  {
    id: 1,
    tipo: 'INCIDENTE',
    titulo: 'Sin Wi-Fi en bloque B',
    descripcion: 'Desde esta mañana no conecta a la red institucional en el segundo piso.',
    prioridad: 'P2',
    estado: 'EN_ATENCION',
    solicitante: { id: 1, nombre: 'Laura Méndez' },
    agente: { id: 3, nombre: 'Andrés Pérez' },
    categoria: { id: 8, nombre: 'Wi-Fi' },
    area: { id: 3, nombre: 'Red y conectividad' },
    fechaCreacion: '2026-10-01T14:02:00Z',
    fechaAsignacion: '2026-10-01T15:10:00Z',
    fechaCierre: null,
  },
  {
    id: 2,
    tipo: 'SOLICITUD',
    titulo: 'Instalación de Visual Studio Code',
    descripcion: 'Solicito instalación de entorno de desarrollo para el laboratorio 301.',
    prioridad: 'P3',
    estado: 'PENDIENTE',
    solicitante: { id: 2, nombre: 'Carlos Ruiz' },
    agente: null,
    categoria: { id: 5, nombre: 'Instalación' },
    area: { id: 2, nombre: 'Software' },
    fechaCreacion: '2026-10-01T16:00:00Z',
    fechaAsignacion: null,
    fechaCierre: null,
  },
  {
    id: 3,
    tipo: 'INCIDENTE',
    titulo: 'Proyector aula 102 no enciende',
    descripcion: 'El proyector no da señal ni enciende el piloto indicador.',
    prioridad: 'P1',
    estado: 'EN_VALIDACION',
    solicitante: { id: 1, nombre: 'Laura Méndez' },
    agente: { id: 3, nombre: 'Andrés Pérez' },
    categoria: { id: 3, nombre: 'Proyector' },
    area: { id: 1, nombre: 'Hardware' },
    fechaCreacion: '2026-10-01T09:00:00Z',
    fechaAsignacion: '2026-10-01T09:30:00Z',
    fechaCierre: null,
  },
];

export const INITIAL_ATENCIONES: Atencion[] = [
  {
    id: 1,
    casoId: 3,
    diagnostico: 'Cable de alimentación suelto en la regleta principal.',
    solucion: 'Se ajustó el cableado y se realizaron pruebas de proyección correctas.',
    fecha: '2026-10-01T10:15:00Z',
    agenteId: 3,
    agente: { id: 3, nombre: 'Andrés Pérez' },
  },
];

export const INITIAL_HISTORIAL: HistorialItem[] = [
  {
    id: 1,
    casoId: 1,
    evento: 'CREACION',
    estadoAnterior: null,
    estadoNuevo: 'PENDIENTE',
    usuario: { id: 1, nombre: 'Laura Méndez' },
    fecha: '2026-10-01T14:02:00Z',
    comentario: null,
  },
  {
    id: 2,
    casoId: 1,
    evento: 'ASIGNACION',
    estadoAnterior: 'PENDIENTE',
    estadoNuevo: 'EN_ATENCION',
    usuario: { id: 3, nombre: 'Andrés Pérez' },
    fecha: '2026-10-01T15:10:00Z',
    comentario: 'Asignado a Andrés Pérez',
  },
  {
    id: 3,
    casoId: 3,
    evento: 'CREACION',
    estadoAnterior: null,
    estadoNuevo: 'PENDIENTE',
    usuario: { id: 1, nombre: 'Laura Méndez' },
    fecha: '2026-10-01T09:00:00Z',
    comentario: null,
  },
  {
    id: 4,
    casoId: 3,
    evento: 'ASIGNACION',
    estadoAnterior: 'PENDIENTE',
    estadoNuevo: 'EN_ATENCION',
    usuario: { id: 3, nombre: 'Andrés Pérez' },
    fecha: '2026-10-01T09:30:00Z',
    comentario: null,
  },
  {
    id: 5,
    casoId: 3,
    evento: 'ATENCION',
    estadoAnterior: 'EN_ATENCION',
    estadoNuevo: 'EN_VALIDACION',
    usuario: { id: 3, nombre: 'Andrés Pérez' },
    fecha: '2026-10-01T10:15:00Z',
    comentario: 'Atención completada',
  },
];
