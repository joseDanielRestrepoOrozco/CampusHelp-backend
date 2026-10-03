# CampusHelp – Backend

API REST de CampusHelp construida con **Express 5**, **TypeScript** y **Prisma ORM (Prisma 8)** sobre **PostgreSQL 17**. Implementa las reglas de negocio, validaciones y acceso a datos para la mesa de servicios tecnológicos universitarios.

El contrato de la API (especificación de rutas, cuerpos de solicitud, cabeceras y códigos de error estándar) se encuentra documentado en `docs/03-api.md` del repositorio `sw3-frontend`.

---

## Requisitos

- **Node.js 24 o posterior** (comprobar con `node -v`).
- **npm** (incluido con Node.js).
- **Docker y Docker Compose** (para iniciar PostgreSQL 17 localmente) o una instancia local/remota de **PostgreSQL 15+**.

---

## Levantar todo el proyecto (Backend + Frontend juntos)

Para ejecutar la solución completa, ambos repositorios deben clonarse como carpetas hermanas:

```
proyecto/
├── CampusHelp-backend/   # Este repositorio (Backend)
└── sw3-frontend/          # Repositorio Frontend en React
```

### Paso 1: Iniciar la base de datos PostgreSQL

En la raíz de `CampusHelp-backend`, inicia el contenedor de PostgreSQL con Docker Compose:

```bash
docker compose up -d postgres
```

Para verificar que el contenedor esté corriendo y saludable:

```bash
docker ps --filter "name=sw3-postgres"
```

### Paso 2: Configurar variables de entorno del Backend

Copia el archivo de plantilla `.env.example` a `.env`:

```bash
cp .env.example .env
```

Los valores por defecto coinciden exactamente con la configuración de `docker-compose.yml`:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campushelp?schema=public"
ALLOWED_ORIGINS="http://localhost:5173"
NODE_ENV=development
```

> [!IMPORTANT]
> `ALLOWED_ORIGINS` debe incluir `http://localhost:5173` para permitir que el frontend se comunique con la API sin bloqueos de CORS en el navegador.

### Paso 3: Instalar dependencias del Backend

```bash
npm install
```

### Paso 4: Ejecutar migraciones de Prisma ORM

Aplica las migraciones pendientes en PostgreSQL para crear las tablas, enums y restricciones:

```bash
npx prisma db migrate
```

### Paso 5: Cargar datos semilla (Seed)

Ejecuta el script de seed para poblar la base de datos con las áreas, categorías y usuarios de prueba:

```bash
npm run seed
```

El script es idempotente (usa upserts): carga 5 áreas tecnológicas, 16 categorías y 7 usuarios con diferentes roles.

### Paso 6: Iniciar el servidor Backend

```bash
npm run dev
```

El backend queda escuchando peticiones en:
```
http://localhost:3000/api
```

> [!NOTE]
> **Base URL:** Todas las rutas de la API están bajo el prefijo `/api`. Una petición a `http://localhost:3000/` responderá `404 NO_ENCONTRADO` por diseño. Para verificar que el backend está funcionando correctamente, puedes consultar:
> `curl http://localhost:3000/api/usuarios` o `curl http://localhost:3000/api/areas`

---

### Paso 7: Levantar el Frontend (`sw3-frontend`)

Abre una **segunda terminal** y navega al repositorio del frontend:

```bash
cd ../sw3-frontend
npm install
cp .env.example .env
```

Asegúrate de que el archivo `.env` del frontend contenga la URL base del backend:

```env
VITE_API_URL="http://localhost:3000/api"
```

Inicia el servidor de desarrollo del frontend:

```bash
npm run dev
```

El frontend estará disponible en:
```
http://localhost:5173
```

Abre esa URL en tu navegador. Puedes seleccionar cualquiera de los usuarios de prueba en el selector de la barra superior para explorar la aplicación según el rol asignado.

---

## Usuarios de prueba (Seed)

El comando `npm run seed` crea los siguientes usuarios en la base de datos para pruebas locales:

| ID | Nombre | Correo | Rol | Estado | Propósito en pruebas |
|---|---|---|---|---|---|
| **1** | Laura Méndez | `laura.mendez@campushelp.test` | `SOLICITANTE` | Activo | Crear incidentes/solicitudes y consultar "Mis casos" |
| **2** | Carlos Ruiz | `carlos.ruiz@campushelp.test` | `SOLICITANTE` | Activo | Probar aislamiento de casos entre solicitantes (RN-20) |
| **3** | Andrés Pérez | `andres.perez@campushelp.test` | `AGENTE` | Activo | Atender bandeja de casos, asignarse y registrar atención |
| **4** | Marta Gómez | `marta.gomez@campushelp.test` | `AGENTE` | Activo | Segundo agente para probar reasignaciones y permisos |
| **5** | Sofía Rojas | `sofia.rojas@campushelp.test` | `VALIDADOR` | Activo | Aprobar o devolver soluciones en validación de calidad |
| **6** | Admin TI | `admin@campushelp.test` | `ADMINISTRADOR` | Activo | Métricas e indicadores del servicio y gestión de categorías |
| **7** | Pedro Salas | `pedro.salas@campushelp.test` | `AGENTE` | **Inactivo** | Pruebas de autenticación: la API lo excluye del selector |

---

## Endpoints de la API

La API requiere la cabecera `X-Usuario-Id: <id>` en las rutas que necesitan autenticación (todos los endpoints de casos, indicadores y modificación de categorías). Si falta la cabecera o el usuario no existe/está inactivo, la respuesta es `401 USUARIO_REQUERIDO`.

### Endpoints implementados en Sprint 1

| Método | Ruta | Rol permitido | Historia | Descripción |
|---|---|---|---|---|
| `GET` | `/api/usuarios` | Público (sin auth) | Base | Usuarios activos para el selector de pruebas del front |
| `GET` | `/api/areas` | Público (sin auth) | HU-01 | Listar áreas activas del campus |
| `GET` | `/api/categorias` | Público (sin auth) | HU-01 | Listar categorías activas (filtros opcionales `areaId`, `activa`) |
| `POST` | `/api/casos` | `SOLICITANTE` | HU-01 | Registrar nuevo incidente o solicitud tecnológica |
| `GET` | `/api/casos` | Autenticado | HU-02 / HU-03 | Listar y filtrar casos: solicitantes solo ven sus casos (RN-20); agentes ven bandeja con `noCerrados`, `agenteId`, `q` y `orden` |

### Otros endpoints del contrato (`docs/03-api.md`)

| Método | Ruta | Rol permitido | Historia | Descripción |
|---|---|---|---|---|
| `GET` | `/api/casos/:id` | Autenticado | HU-12 | Detalle del caso con atenciones registradas |
| `PATCH` | `/api/casos/:id/clasificacion` | `AGENTE`, `ADMINISTRADOR` | HU-05 | Reclasificar tipo, categoría y prioridad |
| `PATCH` | `/api/casos/:id/asignar` | `AGENTE`, `ADMINISTRADOR` | HU-04 | Asignar agente responsable |
| `PATCH` | `/api/casos/:id/estado` | `AGENTE`, `ADMINISTRADOR` | HU-05 | Transición de estado permitida en la máquina de estados |
| `POST` | `/api/casos/:id/atencion` | `AGENTE` (asignado) | HU-06 | Registrar diagnóstico y propuesta de solución |
| `POST` | `/api/casos/:id/validacion` | `VALIDADOR` | HU-07 | Aprobar o devolver una solución registrada |
| `GET` | `/api/casos/:id/historial` | Autenticado | HU-08 | Consultar trazabilidad completa de eventos del caso |
| `GET` | `/api/indicadores` | `ADMINISTRADOR` | HU-10 | Métricas de casos por estado, tipo, prioridad y resolución |
| `POST` | `/api/categorias` | `ADMINISTRADOR` | HU-11 | Crear nueva categoría en un área |
| `PUT` | `/api/categorias/:id` | `ADMINISTRADOR` | HU-11 | Actualizar datos de categoría |
| `PATCH` | `/api/categorias/:id/activa` | `ADMINISTRADOR` | HU-11 | Activar o desactivar categoría |
| `DELETE` | `/api/categorias/:id` | `ADMINISTRADOR` | HU-11 | Eliminar categoría (solo si no tiene casos asociados) |

---

## Formato de Respuestas de Error

Todos los errores siguen la especificación cerrada del contrato:

```json
{
  "error": "CATEGORIA_INVALIDA",
  "mensaje": "La categoría no existe, está inactiva o no pertenece al área indicada",
  "detalles": []
}
```

Códigos estándar implementados: `VALIDACION` (400), `USUARIO_REQUERIDO` (401), `ROL_NO_PERMITIDO` (403), `CASO_AJENO` (403), `NO_ES_AGENTE_ASIGNADO` (403), `NO_ENCONTRADO` (404), `CATEGORIA_INVALIDA` (409), `TRANSICION_INVALIDA` (409), `CASO_CERRADO` (409), `ERROR_INTERNO` (500).

---

## Problemas comunes y Soluciones

### 1. Error de CORS en el navegador (`Cross-Origin Request Blocked`)
- **Causa:** El frontend corre en `http://localhost:5173` y el backend no tiene habilitado ese origen.
- **Solución:** Revisa tu archivo `.env` en el backend y asegúrate de tener:
  ```env
  ALLOWED_ORIGINS="http://localhost:5173"
  ```
  Reinicia el backend tras cambiar el `.env`.

### 2. Puerto ocupado (`EADDRINUSE: address already in use :::3000` o `:::5432`)
- **Puerto 3000 (Backend):**
  - Identifica el proceso que lo usa: `lsof -i :3000`
  - Termina el proceso: `kill -9 <PID>`
  - O cambia el puerto en `.env` a `PORT=3001` y actualiza `VITE_API_URL="http://localhost:3001/api"` en el frontend.
- **Puerto 5432 (PostgreSQL):**
  - Si tienes un servicio local de PostgreSQL activo, deténlo (`brew services stop postgresql` o equivalente) o cambia el mapeo del puerto en `docker-compose.yml` (por ejemplo `"5433:5432"`) y ajusta `DATABASE_URL` en `.env`.

### 3. Error `relation "caso" does not exist` o tablas faltantes
- **Causa:** No se ejecutó la migración inicial de la base de datos.
- **Solución:** Ejecuta:
  ```bash
  npx prisma db migrate
  ```

### 4. Error 401 `USUARIO_REQUERIDO` o selector de usuario vacío
- **Causa:** La base de datos está creada pero no contiene los usuarios de prueba.
- **Solución:** Ejecuta el comando de seed:
  ```bash
  npm run seed
  ```

### 5. Error `connect ECONNREFUSED 127.0.0.1:5432`
- **Causa:** El contenedor de PostgreSQL no está en ejecución.
- **Solución:** Inicia el contenedor con:
  ```bash
  docker compose up -d postgres
  ```

---

## Scripts Disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga en caliente (`tsx --watch`). |
| `npm run build` | Compila el código TypeScript a JavaScript en `dist/` usando `tsc`. |
| `npm start` | Inicia la versión compilada desde `dist/src/index.js`. |
| `npm run seed` | Carga las áreas, categorías y usuarios de prueba en PostgreSQL. |
| `npx prisma db migrate` | Aplica migraciones de Prisma ORM a la base de datos. |
| `npm run contract:emit` | Regenera los artefactos de contrato Prisma (`contract.json` y `contract.d.ts`). |
| `npm run lint` | Ejecuta el análisis estático de código con `oxlint`. |
| `npm run fmt:check` | Verifica que el formato del código cumpla con las reglas de `oxfmt`. |
| `npm run fmt` | Aplica el formateo automático a todos los archivos de `src/`. |

---

## Arquitectura y Estructura del Código

El backend sigue una arquitectura modular y limpia organizada por entidad de dominio:

```
src/
├── config/        # Variables de entorno validadas al arranque
├── errors/        # AppError y códigos de error estandarizados del contrato
├── middleware/    # Auth (X-Usuario-Id), manejo global de errores y rutas 404
├── schemas/       # Esquemas de validación Zod (body, query params e IDs)
├── dto/           # Definición de tipos de respuesta JSON esperados por el contrato
├── repositories/  # Acceso a datos con Prisma ORM (un repositorio por tabla)
├── services/      # Lógica de negocio y reglas del dominio (RN-01 a RN-22)
├── controllers/   # Controladores HTTP: validación de entrada y respuesta
├── routes/        # Enrutadores Express organizados por entidad (/usuarios, /areas, /casos...)
├── prisma/        # Contrato Prisma (contract.prisma), cliente db y script de seed
├── container.ts   # Inyección de dependencias (repositorios → servicios → controladores)
├── app.ts         # Configuración del servidor Express, seguridad (helmet, cors, rate limit)
└── index.ts       # Punto de entrada de la aplicación
```
