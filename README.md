# sw3-backend

API REST pequeña con Express 5, TypeScript y Prisma ORM para PostgreSQL.

## Requisitos

- Node.js 24 o posterior
- PostgreSQL 15 o posterior

## Desarrollo

1. Copia `.env.example` a `.env` y configura `DATABASE_URL`.
2. Inicia PostgreSQL localmente con `docker compose up -d postgres` si lo necesitas.
3. Inicializa/actualiza la base de datos según el flujo de Prisma ORM del proyecto.
4. Ejecuta `npm run dev`.

`ALLOWED_ORIGINS` es opcional y acepta orígenes separados por comas. Si no se define, no se envían cabeceras CORS.

## Scripts

- `npm run dev` — servidor de desarrollo con recarga.
- `npm run build` — compila TypeScript a `dist/`.
- `npm start` — inicia la compilación.
- `npm run contract:emit` — regenera los artefactos del contrato Prisma.

## Estructura

- `src/routes` — definición de rutas HTTP.
- `src/controllers` — adaptación de solicitudes/respuestas.
- `src/repositories` — acceso a datos con Prisma ORM.
- `src/schemas` — validación de entradas con Zod y tipos inferidos.
- `src/middleware` — seguridad, errores y rutas inexistentes.
- `src/config` — configuración validada desde el entorno.

Los controladores usan el repositorio directamente mientras no haya lógica de negocio que justifique un servicio intermedio. Si aparecen reglas de negocio o coordinación entre dependencias, esa capa se puede añadir entonces.

La limitación de solicitudes usa almacenamiento en memoria y sirve para una sola instancia. En despliegues con varias instancias, debe configurarse un store compartido. `docker-compose.yml` es solo para desarrollo local; las credenciales de ejemplo no deben usarse en producción.

Las rutas de usuarios todavía no tienen autenticación ni autorización. CORS y el límite de solicitudes no sustituyen esos controles; no expongas estos endpoints con datos reales hasta definir e implementar quién puede crear y consultar usuarios.
