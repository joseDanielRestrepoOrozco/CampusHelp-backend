# CampusHelp – Backend

API REST de CampusHelp con Express 5, TypeScript y Prisma ORM para PostgreSQL. El contrato de la API (rutas, cuerpos y códigos de error) está en `docs/03-api.md` del repositorio `sw3-frontend`.

## Requisitos

- Node.js 24 o posterior
- PostgreSQL 15 o posterior

## Desarrollo

1. Copia `.env.example` a `.env`. Sus valores ya coinciden con `docker-compose.yml`.
2. Inicia PostgreSQL localmente con `docker compose up -d postgres` si lo necesitas.
3. Inicializa/actualiza la base de datos según el flujo de Prisma ORM del proyecto (`npx prisma db migrate`).
4. Carga los datos semilla de áreas, categorías y usuarios de prueba ejecutando `npm run seed`.
5. Ejecuta `npm run dev`.

`ALLOWED_ORIGINS` es opcional y acepta orígenes separados por comas. Si no se define, no se envían cabeceras CORS.

## Scripts

- `npm run dev` — servidor de desarrollo con recarga.
- `npm run build` — compila TypeScript a `dist/`.
- `npm start` — inicia la versión compilada desde `dist/`.
- `npm run seed` — inserta o actualiza las áreas, categorías y usuarios de prueba en la base de datos (idempotente).
- `npm run contract:emit` — regenera los artefactos del contrato Prisma.

## Endpoints implementados

Todas las rutas van bajo `/api`. Las de `/casos` exigen la cabecera `X-Usuario-Id` con un usuario de prueba activo.

| Método | Ruta | Historia |
|---|---|---|
| GET | `/api/usuarios` | HU-01 (selector de usuario de prueba, solo activos) |
| GET | `/api/areas` | HU-01 |
| GET | `/api/categorias?areaId=&activa=` | HU-01 |
| POST | `/api/casos` | HU-01 |

## Estructura

Cada entidad tiene sus propios archivos en cada capa (`usuarios`, `areas`, `categorias`, `casos`…):

- `src/routes` — rutas HTTP de cada entidad.
- `src/controllers` — leen la petición, validan con el esquema y responden.
- `src/services` — reglas de negocio. Solo existen cuando hay reglas (por ahora, casos).
- `src/repositories` — acceso a datos con Prisma ORM. Un repositorio por tabla.
- `src/dto` — forma exacta en que cada recurso sale en el JSON, según el contrato.
- `src/schemas` — validación de entradas con Zod. Los validadores de query compartidos están en `query.schema.ts`.
- `src/middleware` — usuario actual (`X-Usuario-Id`), errores y rutas inexistentes.
- `src/errors` — `AppError` y la lista cerrada de códigos de error del contrato.
- `src/config` — configuración validada desde el entorno.
- `src/container.ts` — crea los repositorios, servicios y controladores e inyecta sus dependencias.

En el servicio se validan las reglas y se decide el error; el repositorio solo accede a datos. Los endpoints sin reglas de negocio (usuarios, áreas, categorías) usan el repositorio directamente desde el controlador.

La limitación de solicitudes usa almacenamiento en memoria y sirve para una sola instancia. `docker-compose.yml` es solo para desarrollo local; sus credenciales no deben usarse en producción.
