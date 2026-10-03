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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sw3"
ALLOWED_ORIGINS="http://localhost:5173"
```

> [!IMPORTANT]
> `ALLOWED_ORIGINS` debe incluir `http://localhost:5173` para permitir que el frontend se comunique con la API sin bloqueos de CORS en el navegador.

### Paso 3: Instalar dependencias del Backend

```bash
npm install
```

### Paso 4: Ejecutar migraciones de Prisma ORM

Aplica las migraciones en PostgreSQL para crear las tablas, enums y restricciones:

```bash
npx prisma db migrate
```

### Paso 5: Cargar datos semilla (Seed)

Ejecuta el script de seed para poblar la base de datos con las áreas, categorías y usuarios de prueba:

```bash
npm run seed
```

El script es idempotente (usa upserts): carga 5 áreas tecnológicas, 16 categorías y 7 usuarios con diferentes roles en la base de datos `sw3`.

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

Abre esa URL en tu navegador. Puedes seleccionar cualquiera de los usuarios de prueba en el selector de la **barra lateral** para explorar la aplicación según el rol asignado.

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

La API requiere la cabecera `X-Usuario-Id: <id>` en las rutas protegidas. Si falta la cabecera o el usuario no existe o está inactivo, la respuesta es `401 USUARIO_REQUERIDO`.

### Endpoints implementados en `development`

| Método | Ruta | Rol permitido | Historia | Descripción |
|---|---|---|---|---|
| `GET` | `/api/usuarios` | Público (sin auth) | Base | Usuarios activos para el selector de pruebas del front |
| `GET` | `/api/areas` | Público (sin auth) | HU-01 | Listar áreas activas del campus |
| `GET` | `/api/categorias` | Público (sin auth) | HU-01 | Listar categorías (sin filtros devuelve activas e inactivas; admite `?areaId=&activa=`) |
| `POST` | `/api/casos` | `SOLICITANTE` | HU-01 | Registrar nuevo incidente o solicitud tecnológica |
| `GET` | `/api/casos` | Autenticado | HU-02 | Listar casos: solicitantes solo ven sus casos (RN-20); los demás roles pueden filtrar por `solicitanteId`. Orden `fecha_desc`. |

---

## Formato de Respuestas de Error

Todos los errores siguen la especificación cerrada del contrato (`docs/03-api.md`):

```json
{
  "error": "CATEGORIA_INVALIDA",
  "mensaje": "La categoría no existe, está inactiva o no pertenece al área indicada",
  "detalles": []
}
```

Códigos de error implementados actualmente en el backend:
- `VALIDACION` (400): Entrada o query params inválidos según el esquema Zod.
- `USUARIO_REQUERIDO` (401): Falta `X-Usuario-Id` o el usuario no existe o está inactivo.
- `ROL_NO_PERMITIDO` (403): El rol no tiene permiso para la operación (ej. no solicitante en `POST /casos`).
- `NO_ENCONTRADO` (404): Ruta o recurso no encontrado.
- `CATEGORIA_INVALIDA` (409): Categoría inexistente, inactiva o que no pertenece al área enviada (RN-03).
- `ERROR_INTERNO` (500): Fallos no controlados.

---

## Problemas comunes y Soluciones

### 1. Error de CORS en el navegador (`Cross-Origin Request Blocked`)
- **Causa:** El frontend corre en `http://localhost:5173` y el backend no tiene habilitado ese origen.
- **Solución:** Revisa tu archivo `.env` en el backend y asegúrate de tener:
  ```env
  ALLOWED_ORIGINS="http://localhost:5173"
  ```
  Reinicia el backend tras guardar el `.env`.

### 2. Puerto 3000 ocupado (`EADDRINUSE: address already in use :::3000`)
- **En Windows (PowerShell):**
  ```powershell
  Get-NetTCPConnection -LocalPort 3000
  Stop-Process -Id <PID>
  ```
- **En macOS / Linux:**
  ```bash
  lsof -i :3000
  kill -9 <PID>
  ```
- **Alternativa:** Cambiar el puerto en `.env` a `PORT=3001` y actualizar en el frontend `VITE_API_URL="http://localhost:3001/api"`.

### 3. Puerto 5432 ocupado (PostgreSQL local en la máquina)
Si ya tienes una instancia local de PostgreSQL corriendo en el puerto 5432 o un contenedor previo:
- Verifica los contenedores activos: `docker ps`.
- Para no alterar `docker-compose.yml`, crea un archivo local `docker-compose.override.yml` (ignorado en git) para mapear un puerto libre como el 5433:
  ```yaml
  services:
    postgres:
      ports:
        - "127.0.0.1:5433:5432"
  ```
  Y ajusta `DATABASE_URL` en tu `.env` al nuevo puerto:
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sw3"
  ```

### 4. Error `relation "caso" does not exist` o tablas faltantes
- **Causa:** No se ejecutó la migración inicial de la base de datos.
- **Solución:** Ejecuta:
  ```bash
  npx prisma db migrate
  ```

### 5. Error 401 `USUARIO_REQUERIDO` o selector de usuario vacío
- **Causa:** La base de datos está creada pero no contiene los usuarios de prueba.
- **Solución:** Ejecuta el comando de seed:
  ```bash
  npm run seed
  ```

### 6. Error `connect ECONNREFUSED 127.0.0.1:5432`
- **Causa:** El contenedor de PostgreSQL no está en ejecución.
- **Solución:** Inicia el contenedor con `docker compose up -d postgres`.

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
