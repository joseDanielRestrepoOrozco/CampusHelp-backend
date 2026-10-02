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
- `src/services` — reglas de negocio que coordinan más de un repositorio.

La capa de servicio aparece cuando hay reglas de negocio que no le corresponden a una sola consulta: ahí se validan las reglas y se decide el error; el repositorio solo accede a datos. Los endpoints sin reglas de negocio (como los de usuarios) siguen hablando directo con el repositorio.

La limitación de solicitudes usa almacenamiento en memoria y sirve para una sola instancia. En despliegues con varias instancias, debe configurarse un store compartido. `docker-compose.yml` es solo para desarrollo local; las credenciales de ejemplo no deben usarse en producción.

Las rutas de usuarios todavía no tienen autenticación ni autorización. CORS y el límite de solicitudes no sustituyen esos controles; no expongas estos endpoints con datos reales hasta definir e implementar quién puede crear y consultar usuarios.
