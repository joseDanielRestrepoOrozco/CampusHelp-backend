import { INITIAL_USUARIOS, INITIAL_AREAS, INITIAL_CATEGORIAS } from '../data/seed-data.js';

export async function runSeed(): Promise<void> {
  console.info('====================================================');
  console.info('🌱 Iniciando Seed de datos iniciales para CampusHelp');
  console.info('====================================================');

  console.info('\n👤 1. Insertando usuarios de prueba...');
  for (const u of INITIAL_USUARIOS) {
    console.info(`   - [ID ${u.id}] ${u.nombre} (${u.correo}) - Rol: ${u.rol} - Activo: ${u.activo ? 'Sí' : 'No'}`);
  }

  console.info('\n🏢 2. Insertando áreas iniciales...');
  for (const a of INITIAL_AREAS) {
    console.info(`   - [ID ${a.id}] ${a.nombre}: "${a.descripcion}"`);
  }

  console.info('\n📂 3. Insertando categorías iniciales por área...');
  for (const c of INITIAL_CATEGORIAS) {
    console.info(`   - [ID ${c.id}] Área ${c.areaId}: ${c.nombre} ("${c.descripcion}")`);
  }

  console.info('\n====================================================');
  console.info('✅ Seed completado con éxito:');
  console.info(`   • ${INITIAL_USUARIOS.length} usuarios de prueba preparados`);
  console.info(`   • ${INITIAL_AREAS.length} áreas registradas`);
  console.info(`   • ${INITIAL_CATEGORIAS.length} categorías registradas`);
  console.info('====================================================\n');
}

// Ejecución directa si se invoca con tsx
if (process.argv[1]?.includes('seed')) {
  runSeed().catch(error => {
    console.error('❌ Error ejecutando seed:', error);
    process.exit(1);
  });
}
