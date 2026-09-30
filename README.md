# CampusHelp - Backend (sw3-backend)

API REST para la gestión de incidentes y solicitudes de servicios tecnológicos universitarios (**CampusHelp**), desarrollada con **Express 5**, **TypeScript**, **Zod** y **Prisma ORM** para PostgreSQL.

---

## 🚀 Guía de Ejecución: Backend y Frontend Juntos

Para operar el sistema completo en entorno local, sigue los pasos a continuación.

### 1. Requisitos Previos
- **Node.js** v20 o posterior (recomendado Node 22 o 24).
- **Docker y Docker Compose** (para PostgreSQL) o un servidor PostgreSQL 15+ local.
- **npm** v10+.

---

### 2. Configuración del Backend

1. **Clonar e ingresar al directorio:**
   ```bash
   cd CampusHelp-backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo de ejemplo a `.env`:
   ```bash
   cp .env.example .env
   ```
   Asegúrate de que contenga:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sw3"
   ALLOWED_ORIGINS="http://localhost:5173"
   ```

4. **Iniciar la base de datos PostgreSQL:**
   Si dispones de Docker:
   ```bash
   docker compose up -d postgres
   ```
   *Credenciales por defecto: usuario `postgres`, contraseña `postgres`, base de datos `sw3`, puerto `5432`.*

5. **Cargar los datos semilla (Seed):**
   Para poblar los usuarios de prueba, las 5 áreas y las 16 categorías iniciales:
   ```bash
   npm run seed
   ```
   *(También dispones de `docs/seed_CampusHelp.sql` si deseas importarlo directamente con `psql` o pgAdmin).*

6. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La API quedará escuchando en:
   - Base API: `http://localhost:3000/api`
   - Healthcheck / Raíz: `http://localhost:3000/`

---

### 3. Configuración y Ejecución del Frontend (`sw3-frontend`)

1. En una nueva terminal, navega al repositorio del frontend:
   ```bash
   cd ../sw3-frontend
   ```

2. Instala dependencias y configura `.env`:
   ```bash
   npm install
   ```
   Crea o verifica `.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. Inicia el frontend en modo desarrollo:
   ```bash
   npm run dev
   ```
   El frontend estará accesible en `http://localhost:5173`. Al abrirlo, el selector de usuario cargará automáticamente los usuarios de prueba desde `GET /api/usuarios`.

---

## 👥 Usuarios de Prueba (Cabecera `X-Usuario-Id`)

En este entorno no se usa autenticación con contraseña. El frontend envía el ID del usuario seleccionado en la cabecera `X-Usuario-Id`.

| ID | Nombre | Correo | Rol | Activo | Uso en Pruebas |
|:--:|:-------|:-------|:----|:------:|:---------------|
| **1** | Laura Méndez | `laura.mendez@campushelp.test` | `SOLICITANTE` | Sí | Registro y consulta de mis casos |
| **2** | Carlos Ruiz | `carlos.ruiz@campushelp.test` | `SOLICITANTE` | Sí | Solicitante alterno |
| **3** | Andrés Pérez | `andres.perez@campushelp.test` | `AGENTE` | Sí | Bandeja de agente, asignación y atención |
| **4** | Marta Gómez | `marta.gomez@campushelp.test` | `AGENTE` | Sí | Agente alterno |
| **5** | Sofía Rojas | `sofia.rojas@campushelp.test` | `VALIDADOR` | Sí | Aprobación y devolución de soluciones |
| **6** | Admin TI | `admin@campushelp.test` | `ADMINISTRADOR` | Sí | Gestión de categorías e indicadores |
| **7** | Pedro Salas | `pedro.salas@campushelp.test` | `AGENTE` | **No** | Probar regla RN-18 (usuario inactivo) |

---

## 📡 Endpoints del Contrato de la API

| Método | Ruta | Rol requerido | Descripción |
|:------:|:-----|:-------------:|:------------|
| `GET` | `/api/usuarios` | Público | Lista de usuarios de prueba para el selector |
| `GET` | `/api/areas` | Público | Lista de áreas de soporte activas |
| `GET` | `/api/categorias` | Público | Lista de categorías (filtros `?areaId=&activa=`) |
| `POST` | `/api/categorias` | `ADMINISTRADOR` | Crear nueva categoría en un área |
| `PUT` | `/api/categorias/:id` | `ADMINISTRADOR` | Editar nombre/descripción de categoría |
| `PATCH` | `/api/categorias/:id/activa` | `ADMINISTRADOR` | Activar o desactivar categoría |
| `DELETE` | `/api/categorias/:id` | `ADMINISTRADOR` | Eliminar categoría (si no tiene casos) |
| `POST` | `/api/casos` | `SOLICITANTE` | Registrar incidente o solicitud |
| `GET` | `/api/casos` | Todos | Bandeja de casos con filtros (`q`, `estado`, etc.) |
| `GET` | `/api/casos/:id` | Autorizado | Detalle del caso con atenciones ordenadas |
| `PATCH` | `/api/casos/:id/asignar` | `AGENTE`/`ADMIN` | Asignar agente responsable |
| `PATCH` | `/api/casos/:id/estado` | `AGENTE`/`ADMIN` | Transición manual de estado |
| `POST` | `/api/casos/:id/atencion` | `AGENTE` | Registrar diagnóstico y solución técnica |
| `POST` | `/api/casos/:id/validacion` | `VALIDADOR` | Aprobar (cierra) o devolver solución |
| `GET` | `/api/casos/:id/historial` | Autorizado | Línea de tiempo y trazabilidad del caso |
| `GET` | `/api/indicadores` | Todos | Métricas del servicio (`desde`, `hasta`) |

---

## 🛠️ Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con recarga automática (`tsx`).
- `npm run test`: Ejecuta la suite de pruebas automatizadas del contrato de API.
- `npm run seed`: Carga los datos semilla en memoria / consola.
- `npm run lint`: Ejecuta el linter ultrarrápido `oxlint`.
- `npm run fmt`: Formatea el código fuente con `oxfmt`.
- `npm run build`: Compila TypeScript a JavaScript en `dist/`.
- `npm start`: Inicia el servidor en producción desde `dist/`.
