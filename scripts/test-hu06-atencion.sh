#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Pruebas manuales de HU-06 (issue #29): POST /api/casos/:id/atencion.
#
# Verifica el contrato y las reglas de negocio del endpoint:
#   - 201 con { id, casoId, diagnostico, solucion, fecha, agente: { id, nombre } }.
#   - Orden de errores del contrato: 400 -> 404 -> 403 -> 409.
#   - 403 ROL_NO_PERMITIDO y 403 NO_ES_AGENTE_ASIGNADO.
#   - 409 ESTADO_NO_PERMITE_OPERACION.
#   - Varias atenciones por caso y su evento ATENCION en el historial.
#   - RN-13: EN_ATENCION -> EN_VALIDACION exige una solucion vigente, incluso
#     con una devolucion de por medio (la devolucion se simula en la BD porque
#     la HU-07 de validacion todavia no esta en esta rama).
#
# Requisitos:
#   - Servidor levantado (npm run dev) en API_BASE (por defecto
#     http://localhost:3000/api).
#   - Base migrada (npx prisma db migrate) y seed cargado (npm run seed).
#   - curl y node disponibles (node ya es dependencia del repo).
#
# Uso:
#   scripts/test-hu06-atencion.sh
#   API_BASE=http://localhost:3001/api scripts/test-hu06-atencion.sh
#
# Cada corrida crea un caso nuevo, asi que se puede ejecutar varias veces. No
# borra datos: deja los casos de prueba en la base.
# ---------------------------------------------------------------------------
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3000/api}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Ids del seed (ver README). Se pueden sobrescribir por entorno.
SOLICITANTE_ID="${SOLICITANTE_ID:-1}"
AGENTE_ID="${AGENTE_ID:-3}"
OTRO_AGENTE_ID="${OTRO_AGENTE_ID:-4}"

ATENCION_OK='{"diagnostico":"Diagnostico de prueba con mas de diez caracteres","solucion":"Solucion aplicada de prueba con mas de diez caracteres"}'

PASS=0
FAIL=0
SKIP=0

# --- utilidades ------------------------------------------------------------

jget() {
  # Lee un JSON por stdin y devuelve el valor de la ruta indicada.
  # Uso: printf '%s' "$json" | jget 'agente.id'
  node -e '
    let raw = "";
    process.stdin.on("data", chunk => (raw += chunk));
    process.stdin.on("end", () => {
      let value = JSON.parse(raw);
      for (const key of process.argv[1].split(".").filter(Boolean)) {
        value = value == null ? value : value[key];
      }
      process.stdout.write(value === undefined || value === null ? "" : String(value));
    });
  ' "$1"
}

# api METHOD PATH [USUARIO_ID] [JSON] -> deja el resultado en HTTP_STATUS/HTTP_BODY.
api() {
  local method="$1" path="$2" uid="${3:-}" body="${4:-}"
  local -a args=(-sS -X "$method" "$API_BASE$path" -H 'Content-Type: application/json')
  if [ -n "$uid" ]; then
    args+=(-H "X-Usuario-Id: $uid")
  fi
  if [ -n "$body" ]; then
    args+=(-d "$body")
  fi

  local raw
  if ! raw="$(curl "${args[@]}" -w $'\n%{http_code}')"; then
    printf 'No se pudo conectar con %s. Esta el servidor levantado?\n' "$API_BASE" >&2
    exit 1
  fi
  HTTP_STATUS="${raw##*$'\n'}"
  HTTP_BODY="${raw%$'\n'*}"
}

jbody() { printf '%s' "$HTTP_BODY" | jget "$1"; }

ok() { PASS=$((PASS + 1)); printf '  [OK]    %s\n' "$1"; }
ko() { FAIL=$((FAIL + 1)); printf '  [FALLA] %s (esperado: %s | obtenido: %s)\n' "$1" "$2" "$3"; }
skip() { SKIP=$((SKIP + 1)); printf '  [SKIP]  %s\n' "$1"; }

check_status() {
  local nombre="$1" esperado="$2"
  if [ "$HTTP_STATUS" = "$esperado" ]; then
    ok "$nombre"
  else
    ko "$nombre" "$esperado" "$HTTP_STATUS"
  fi
}

check_error() {
  local nombre="$1" esperado_status="$2" esperado_codigo="$3"
  local codigo
  codigo="$(jbody error)"
  if [ "$HTTP_STATUS" = "$esperado_status" ] && [ "$codigo" = "$esperado_codigo" ]; then
    ok "$nombre"
  else
    ko "$nombre" "$esperado_status $esperado_codigo" "$HTTP_STATUS $codigo"
  fi
}

check_value() {
  local nombre="$1" esperado="$2" obtenido="$3"
  if [ "$esperado" = "$obtenido" ]; then
    ok "$nombre"
  else
    ko "$nombre" "$esperado" "$obtenido"
  fi
}

# Inserta una devolucion directamente en la BD para probar RN-13 con una
# devolucion de por medio. Usa tsx (devDependency) y el mismo cliente Prisma del
# proyecto. Devuelve distinto de cero si no se pudo (se reporta como SKIP).
simular_devolucion() {
  local caso_id="$1" usuario_id="$2" tmp status
  tmp="$ROOT/.hu06-devolucion-$$.mts"

  cat > "$tmp" <<EOF
import { db } from './src/prisma/db.js';

const caso = await db.orm.public.Caso.where({ id: ${caso_id} }).first();
if (!caso) {
  console.error('No existe el caso ${caso_id}');
  process.exit(1);
}

await db.orm.public.Historial.create({
  casoId: ${caso_id},
  evento: 'DEVOLUCION',
  estadoAnterior: caso.estado,
  estadoNuevo: caso.estado,
  usuarioId: ${usuario_id},
  comentario: 'Devolucion simulada por scripts/test-hu06-atencion.sh',
});

await db.close();
EOF

  if ( cd "$ROOT" && npx --no-install tsx "$tmp" ); then
    status=0
  else
    status=1
  fi

  rm -f "$tmp"
  return "$status"
}

# --- pruebas ---------------------------------------------------------------

printf '\nHU-06 - POST /api/casos/:id/atencion - %s\n\n' "$API_BASE"

# 0. Descubrir un area y una categoria activa del seed.
api GET /areas
AREA_ID="$(jbody '0.id')"
api GET "/categorias?areaId=$AREA_ID&activa=true"
CATEGORIA_ID="$(jbody '0.id')"

if [ -z "$AREA_ID" ] || [ -z "$CATEGORIA_ID" ]; then
  printf 'No hay areas o categorias activas. Ejecutaste npm run seed?\n' >&2
  exit 1
fi

# 1. Crear un caso como solicitante (queda PENDIENTE).
TITULO="Prueba HU-06 $(date +%s)"
api POST /casos "$SOLICITANTE_ID" \
  "{\"tipo\":\"INCIDENTE\",\"titulo\":\"$TITULO\",\"descripcion\":\"Caso generado por el script de pruebas de HU-06\",\"prioridad\":\"P2\",\"areaId\":$AREA_ID,\"categoriaId\":$CATEGORIA_ID}"
check_status "POST /casos crea el caso (201)" 201
CASO_ID="$(jbody id)"
printf '  caso de prueba: #%s\n' "$CASO_ID"

# 2. Asignar al agente (PENDIENTE es asignable, RN-19).
api PATCH "/casos/$CASO_ID/asignar" "$AGENTE_ID" "{\"agenteId\":$AGENTE_ID}"
check_status "PATCH asignar al agente (200)" 200

# 3. Orden de errores del contrato (el caso aun esta PENDIENTE).
api POST "/casos/2147483647/atencion" "$AGENTE_ID" '{"diagnostico":"corto","solucion":"corta"}'
check_error "400 VALIDACION precede al 404 si el body es invalido" 400 VALIDACION

api POST "/casos/2147483647/atencion" "$AGENTE_ID" "$ATENCION_OK"
check_error "404 NO_ENCONTRADO si el caso no existe" 404 NO_ENCONTRADO

api POST "/casos/$CASO_ID/atencion" "$SOLICITANTE_ID" "$ATENCION_OK"
check_error "403 ROL_NO_PERMITIDO para un solicitante" 403 ROL_NO_PERMITIDO

api POST "/casos/$CASO_ID/atencion" "$OTRO_AGENTE_ID" "$ATENCION_OK"
check_error "403 NO_ES_AGENTE_ASIGNADO para otro agente" 403 NO_ES_AGENTE_ASIGNADO

api POST "/casos/$CASO_ID/atencion" "$AGENTE_ID" "$ATENCION_OK"
check_error "409 ESTADO_NO_PERMITE_OPERACION fuera de EN_ATENCION" 409 ESTADO_NO_PERMITE_OPERACION

# 4. Llevar el caso a EN_ATENCION (RN-11: exige agente asignado).
api PATCH "/casos/$CASO_ID/estado" "$AGENTE_ID" '{"estado":"EN_ANALISIS"}'
check_status "PATCH estado -> EN_ANALISIS (200)" 200

api PATCH "/casos/$CASO_ID/estado" "$AGENTE_ID" '{"estado":"EN_ATENCION"}'
check_status "PATCH estado -> EN_ATENCION con agente (RN-11, 200)" 200

# 5. RN-13 sin atencion: no se puede enviar a validacion.
api PATCH "/casos/$CASO_ID/estado" "$AGENTE_ID" '{"estado":"EN_VALIDACION"}'
check_error "RN-13: sin atencion no pasa a EN_VALIDACION" 409 SIN_SOLUCION

# 6. Registrar la atencion y validar la forma de la respuesta.
api POST "/casos/$CASO_ID/atencion" "$AGENTE_ID" "$ATENCION_OK"
check_status "POST /casos/:id/atencion devuelve 201" 201
check_value "la atencion responde casoId" "$CASO_ID" "$(jbody casoId)"
check_value "la atencion expone agente.id" "$AGENTE_ID" "$(jbody agente.id)"
if [ -n "$(jbody agente.nombre)" ]; then
  ok "la atencion expone agente.nombre"
else
  ko "la atencion expone agente.nombre" "no vacio" "$(jbody agente.nombre)"
fi

# 7. Varias atenciones por caso.
api POST "/casos/$CASO_ID/atencion" "$AGENTE_ID" "$ATENCION_OK"
check_status "POST /casos/:id/atencion admite varias atenciones (201)" 201

# 8. RN-13 con una devolucion de por medio.
sleep 1
if simular_devolucion "$CASO_ID" "$OTRO_AGENTE_ID"; then
  api PATCH "/casos/$CASO_ID/estado" "$AGENTE_ID" '{"estado":"EN_VALIDACION"}'
  check_error "RN-13: con devolucion posterior no pasa a EN_VALIDACION" 409 SIN_SOLUCION

  sleep 1
  api POST "/casos/$CASO_ID/atencion" "$AGENTE_ID" "$ATENCION_OK"
  check_status "POST atencion posterior a la devolucion (201)" 201

  api PATCH "/casos/$CASO_ID/estado" "$AGENTE_ID" '{"estado":"EN_VALIDACION"}'
  check_status "RN-13: atencion posterior a la devolucion habilita EN_VALIDACION" 200
else
  skip "RN-13 con devolucion (no se pudo simular la devolucion en la BD)"
fi

# 9. El historial registra el evento ATENCION (RN-17).
api GET "/casos/$CASO_ID/historial" "$AGENTE_ID"
check_status "GET /casos/:id/historial (200)" 200
if printf '%s' "$HTTP_BODY" | grep -q '"evento":"ATENCION"'; then
  ok "el historial registra el evento ATENCION"
else
  ko "el historial registra el evento ATENCION" "evento ATENCION" "no encontrado"
fi

# 10. La autenticacion precede a todo.
api POST "/casos/$CASO_ID/atencion" "" "$ATENCION_OK"
check_error "401 USUARIO_REQUERIDO sin cabecera X-Usuario-Id" 401 USUARIO_REQUERIDO

# --- resumen ---------------------------------------------------------------

printf '\nResultado: %d OK, %d FALLA, %d SKIP\n' "$PASS" "$FAIL" "$SKIP"
[ "$FAIL" -eq 0 ]
