import { db } from './db.js';

export interface AreaSeedData {
  nombre: string;
  descripcion: string;
  activa: boolean;
}

export interface CategoriaSeedData {
  areaNombre: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

export interface UsuarioSeedData {
  nombre: string;
  correo: string;
  rol: 'SOLICITANTE' | 'AGENTE' | 'VALIDADOR' | 'ADMINISTRADOR';
  activo: boolean;
}

export const SEED_AREAS: AreaSeedData[] = [
  { nombre: 'Hardware', descripcion: 'Equipos físicos y periféricos', activa: true },
  { nombre: 'Software', descripcion: 'Sistemas operativos y programas institucionales', activa: true },
  { nombre: 'Red y conectividad', descripcion: 'Conectividad cableada e inalámbrica', activa: true },
  { nombre: 'Cuentas y acceso', descripcion: 'Gestión de cuentas institucionales y permisos', activa: true },
  { nombre: 'Plataformas académicas', descripcion: 'Sistemas de apoyo a la docencia y gestión académica', activa: true },
];

export const SEED_CATEGORIAS: CategoriaSeedData[] = [
  // 1. Hardware
  { areaNombre: 'Hardware', nombre: 'Computador', descripcion: 'Problemas con torre, portátil o todo en uno', activa: true },
  { areaNombre: 'Hardware', nombre: 'Periférico', descripcion: 'Teclado, mouse u otros dispositivos', activa: true },
  { areaNombre: 'Hardware', nombre: 'Proyector', descripcion: 'Fallas de video o audio en salas', activa: true },
  { areaNombre: 'Hardware', nombre: 'Impresora', descripcion: 'Impresoras institucionales y atascos', activa: true },

  // 2. Software
  { areaNombre: 'Software', nombre: 'Instalación', descripcion: 'Instalación de software institucional autorizado', activa: true },
  { areaNombre: 'Software', nombre: 'Error de aplicación', descripcion: 'Errores en ejecución o fallas de programas', activa: true },
  { areaNombre: 'Software', nombre: 'Actualización', descripcion: 'Actualizaciones de paquetes y programas', activa: true },

  // 3. Red y conectividad
  { areaNombre: 'Red y conectividad', nombre: 'Wi-Fi', descripcion: 'Red inalámbrica institucional', activa: true },
  { areaNombre: 'Red y conectividad', nombre: 'Internet', descripcion: 'Salida general a Internet y navegación', activa: true },
  { areaNombre: 'Red y conectividad', nombre: 'Red cableada', descripcion: 'Tomas de red y puertos Ethernet', activa: true },

  // 4. Cuentas y acceso
  { areaNombre: 'Cuentas y acceso', nombre: 'Contraseña', descripcion: 'Restablecimiento y cambio de clave institucional', activa: true },
  { areaNombre: 'Cuentas y acceso', nombre: 'Bloqueo de cuenta', descripcion: 'Desbloqueo de cuentas por intentos fallidos', activa: true },
  { areaNombre: 'Cuentas y acceso', nombre: 'Correo institucional', descripcion: 'Buzón institucional y envío/recepción', activa: true },
  { areaNombre: 'Cuentas y acceso', nombre: 'Permisos', descripcion: 'Asignación de roles y permisos a recursos', activa: true },

  // 5. Plataformas académicas
  { areaNombre: 'Plataformas académicas', nombre: 'Campus virtual', descripcion: 'Plataforma Moodle o campus en línea', activa: true },
  { areaNombre: 'Plataformas académicas', nombre: 'Sistema académico', descripcion: 'Portal de notas, matrículas y registros', activa: true },
];

export const SEED_USUARIOS: UsuarioSeedData[] = [
  { nombre: 'Laura Méndez', correo: 'laura.mendez@campushelp.test', rol: 'SOLICITANTE', activo: true },
  { nombre: 'Carlos Ruiz', correo: 'carlos.ruiz@campushelp.test', rol: 'SOLICITANTE', activo: true },
  { nombre: 'Andrés Pérez', correo: 'andres.perez@campushelp.test', rol: 'AGENTE', activo: true },
  { nombre: 'Marta Gómez', correo: 'marta.gomez@campushelp.test', rol: 'AGENTE', activo: true },
  { nombre: 'Sofía Rojas', correo: 'sofia.rojas@campushelp.test', rol: 'VALIDADOR', activo: true },
  { nombre: 'Admin TI', correo: 'admin@campushelp.test', rol: 'ADMINISTRADOR', activo: true },
  { nombre: 'Pedro Salas', correo: 'pedro.salas@campushelp.test', rol: 'AGENTE', activo: false },
];

export async function seed(): Promise<void> {
  console.info('🌱 Iniciando seed de datos para CampusHelp...');

  // 1. Áreas (idempotente por nombre)
  console.info(`🏢 Procesando ${SEED_AREAS.length} áreas...`);
  const areaMap = new Map<string, number>();

  for (const item of SEED_AREAS) {
    const existing = await db.orm.public.Area.where({ nombre: item.nombre }).first();
    let areaId: number;

    if (!existing) {
      const created = await db.orm.public.Area.create({
        nombre: item.nombre,
        descripcion: item.descripcion,
        activa: item.activa,
      });
      areaId = created.id;
      console.info(`   + Área creada: "${item.nombre}" (ID: ${areaId})`);
    } else {
      const updated = await db.orm.public.Area.where({ id: existing.id }).update({
        descripcion: item.descripcion,
        activa: item.activa,
      });
      areaId = updated?.id ?? existing.id;
      console.info(`   ~ Área actualizada: "${item.nombre}" (ID: ${areaId})`);
    }

    areaMap.set(item.nombre, areaId);
  }

  // 2. Categorías (idempotente por (areaId, nombre))
  console.info(`📂 Procesando ${SEED_CATEGORIAS.length} categorías...`);
  for (const item of SEED_CATEGORIAS) {
    const areaId = areaMap.get(item.areaNombre);
    if (!areaId) {
      throw new Error(`Área no encontrada para la categoría "${item.nombre}": "${item.areaNombre}"`);
    }

    const existing = await db.orm.public.Categoria.where({ areaId, nombre: item.nombre }).first();

    if (!existing) {
      const created = await db.orm.public.Categoria.create({
        areaId,
        nombre: item.nombre,
        descripcion: item.descripcion,
        activa: item.activa,
      });
      console.info(`   + Categoría creada: "${item.nombre}" en área "${item.areaNombre}" (ID: ${created.id})`);
    } else {
      const updated = await db.orm.public.Categoria.where({ id: existing.id }).update({
        descripcion: item.descripcion,
        activa: item.activa,
      });
      const catId = updated?.id ?? existing.id;
      console.info(`   ~ Categoría actualizada: "${item.nombre}" en área "${item.areaNombre}" (ID: ${catId})`);
    }
  }

  // 3. Usuarios de prueba (idempotente por correo)
  console.info(`👤 Procesando ${SEED_USUARIOS.length} usuarios de prueba...`);
  for (const item of SEED_USUARIOS) {
    const existing = await db.orm.public.Usuario.where({ correo: item.correo }).first();

    if (!existing) {
      const created = await db.orm.public.Usuario.create({
        nombre: item.nombre,
        correo: item.correo,
        rol: item.rol,
        activo: item.activo,
      });
      console.info(`   + Usuario creado: "${item.nombre}" (${item.correo}) - Rol: ${item.rol} (ID: ${created.id})`);
    } else {
      const updated = await db.orm.public.Usuario.where({ id: existing.id }).update({
        nombre: item.nombre,
        rol: item.rol,
        activo: item.activo,
      });
      const userId = updated?.id ?? existing.id;
      console.info(`   ~ Usuario actualizado: "${item.nombre}" (${item.correo}) - Rol: ${item.rol} (ID: ${userId})`);
    }
  }

  console.info('✅ Seed completado exitosamente.');
}

async function run(): Promise<void> {
  try {
    await seed();
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

if (process.argv[1]?.includes('seed')) {
  run();
}
