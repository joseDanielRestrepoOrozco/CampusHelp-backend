import app from '../app.js';
import type { Server } from 'node:http';

async function runTests() {
  console.info('🚀 Iniciando pruebas automatizadas del API Contract para CampusHelp...');

  const server: Server = await new Promise(resolve => {
    const s = app.listen(0, () => resolve(s));
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('No se pudo obtener la dirección del servidor');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.info(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err);
      failed++;
    }
  }

  try {
    // 1. GET /api/usuarios (no requiere auth)
    await test('GET /api/usuarios retorna lista con 7 usuarios de prueba', async () => {
      const res = await fetch(`${baseUrl}/api/usuarios`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (!Array.isArray(data) || data.length !== 7)
        throw new Error(`Expected 7 users, got ${data.length}`);
      if (data[0].nombre !== 'Laura Méndez') throw new Error(`Wrong user: ${data[0].nombre}`);
    });

    // 2. GET /api/areas (no requiere auth)
    await test('GET /api/areas retorna las 5 áreas activas', async () => {
      const res = await fetch(`${baseUrl}/api/areas`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (!Array.isArray(data) || data.length !== 5)
        throw new Error(`Expected 5 areas, got ${data.length}`);
    });

    // 3. GET /api/categorias (no requiere auth, con filtros)
    await test('GET /api/categorias filtra correctamente por areaId', async () => {
      const res = await fetch(`${baseUrl}/api/categorias?areaId=3&activa=true`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (!Array.isArray(data) || data.length !== 3)
        throw new Error(`Expected 3 categories in Red, got ${data.length}`);
      if (!data.every((c: any) => c.areaId === 3))
        throw new Error('Returned category from wrong area');
    });

    // 4. Verificación de error 401 si falta X-Usuario-Id en rutas protegidas
    await test('GET /api/casos sin X-Usuario-Id retorna 401 USUARIO_REQUERIDO', async () => {
      const res = await fetch(`${baseUrl}/api/casos`);
      if (res.status !== 401) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (data.error !== 'USUARIO_REQUERIDO')
        throw new Error(`Expected error USUARIO_REQUERIDO, got ${data.error}`);
    });

    // 5. Verificación de error 401 si X-Usuario-Id es de usuario inactivo (Pedro Salas id 7)
    await test('GET /api/casos con usuario inactivo retorna 401 USUARIO_REQUERIDO', async () => {
      const res = await fetch(`${baseUrl}/api/casos`, {
        headers: { 'X-Usuario-Id': '7' },
      });
      if (res.status !== 401) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (data.error !== 'USUARIO_REQUERIDO')
        throw new Error(`Expected error USUARIO_REQUERIDO, got ${data.error}`);
    });

    // 6. HU-02 / RN-20: Solicitante solo ve sus propios casos
    await test('GET /api/casos con Solicitante aplica RN-20 y filtra por su id', async () => {
      const res = await fetch(`${baseUrl}/api/casos?solicitanteId=2`, {
        headers: { 'X-Usuario-Id': '1' }, // Laura Méndez (id 1)
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (!data.every((c: any) => c.solicitante.id === 1)) {
        throw new Error('Solicitante vio casos ajenos');
      }
    });

    // 7. HU-03: Bandeja del agente (Andrés Pérez id 3)
    await test('GET /api/casos para Agente permite filtrar no cerrados y asignados a él', async () => {
      const res = await fetch(`${baseUrl}/api/casos?agenteId=3&noCerrados=true`, {
        headers: { 'X-Usuario-Id': '3' },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (!data.every((c: any) => c.agente?.id === 3 && c.estado !== 'CERRADA')) {
        throw new Error('Filtro de bandeja del agente incorrecto');
      }
    });

    // 8. HU-11: Crear categoría (solo Administrador)
    await test('POST /api/categorias con Solicitante retorna 403 ROL_NO_PERMITIDO', async () => {
      const res = await fetch(`${baseUrl}/api/categorias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': '1', // Laura (Solicitante)
        },
        body: JSON.stringify({
          areaId: 1,
          nombre: 'Pantallas táctiles',
        }),
      });
      if (res.status !== 403) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (data.error !== 'ROL_NO_PERMITIDO')
        throw new Error(`Expected ROL_NO_PERMITIDO, got ${data.error}`);
    });

    await test('POST /api/categorias con Administrador crea categoría', async () => {
      const res = await fetch(`${baseUrl}/api/categorias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': '6', // Admin TI
        },
        body: JSON.stringify({
          areaId: 1,
          nombre: 'Pantallas táctiles',
          descripcion: 'Monitores interactivos',
        }),
      });
      if (res.status !== 201) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (data.nombre !== 'Pantallas táctiles' || data.activa !== true)
        throw new Error('Datos incorrectos');
    });

    await test('POST /api/categorias duplicada retorna 409 CATEGORIA_DUPLICADA', async () => {
      const res = await fetch(`${baseUrl}/api/categorias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': '6',
        },
        body: JSON.stringify({
          areaId: 1,
          nombre: 'Pantallas táctiles',
        }),
      });
      if (res.status !== 409) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (data.error !== 'CATEGORIA_DUPLICADA')
        throw new Error(`Expected CATEGORIA_DUPLICADA, got ${data.error}`);
    });

    // 9. HU-07: POST /api/casos/:id/validacion
    await test('POST /api/casos/:id/validacion devolver caso (aprobado: false) exige comentario', async () => {
      const resSinComentario = await fetch(`${baseUrl}/api/casos/3/validacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': '5', // Sofía Rojas (Validador)
        },
        body: JSON.stringify({
          aprobado: false,
        }),
      });
      if (resSinComentario.status !== 400) throw new Error(`Status ${resSinComentario.status}`);
      const dataError = (await resSinComentario.json()) as any;
      if (dataError.error !== 'VALIDACION')
        throw new Error(`Expected VALIDACION, got ${dataError.error}`);

      const resDevolver = await fetch(`${baseUrl}/api/casos/3/validacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': '5',
        },
        body: JSON.stringify({
          aprobado: false,
          comentario: 'El usuario sigue sin conexión en el aula 204.',
        }),
      });
      if (resDevolver.status !== 200) throw new Error(`Status ${resDevolver.status}`);
      const dataDevuelto = (await resDevolver.json()) as any;
      if (dataDevuelto.estado !== 'EN_ATENCION')
        throw new Error(`Expected EN_ATENCION, got ${dataDevuelto.estado}`);
    });

    await test('POST /api/casos/:id/validacion aprobar solución cierra el caso con fechaCierre', async () => {
      // Re-atendemos caso 3 para devolverlo a EN_VALIDACION
      await fetch(`${baseUrl}/api/casos/3/atencion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': '3', // Andrés Pérez (Agente)
        },
        body: JSON.stringify({
          diagnostico: 'Se reemplazó el conector HDMI dañado.',
          solucion: 'Proyección funcionando con resolución óptima.',
        }),
      });

      const resAprobar = await fetch(`${baseUrl}/api/casos/3/validacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': '5', // Sofía Rojas (Validador)
        },
        body: JSON.stringify({
          aprobado: true,
          comentario: 'Solución verificada en sitio con el docente.',
        }),
      });
      if (resAprobar.status !== 200) throw new Error(`Status ${resAprobar.status}`);
      const dataCerrado = (await resAprobar.json()) as any;
      if (dataCerrado.estado !== 'CERRADA' || !dataCerrado.fechaCierre)
        throw new Error('Caso no quedó cerrado');
    });

    await test('POST /api/casos/:id/validacion en caso CERRADA retorna 409 CASO_CERRADO', async () => {
      const res = await fetch(`${baseUrl}/api/casos/3/validacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': '5',
        },
        body: JSON.stringify({
          aprobado: true,
        }),
      });
      if (res.status !== 409) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (data.error !== 'CASO_CERRADO')
        throw new Error(`Expected CASO_CERRADO, got ${data.error}`);
    });

    // 10. GET /api/indicadores (HU-10)
    await test('GET /api/indicadores retorna métricas del servicio', async () => {
      const res = await fetch(`${baseUrl}/api/indicadores`, {
        headers: { 'X-Usuario-Id': '6' },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as any;
      if (typeof data.total !== 'number') throw new Error('total must be a number');
      if (!data.porEstado || !data.porTipo || !data.porPrioridad)
        throw new Error('Missing groupings');
    });
  } finally {
    server.close();
  }

  console.info('\n====================================================');
  console.info(`📊 Resumen de pruebas: ${passed} pasadas, ${failed} fallidas`);
  console.info('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
