# Evidencia y Resultados de Pruebas (CP-04, CP-05, CP-15, CP-18)

**Responsable de Ejecución:** Juan Fernando  
**Tareas Vinculadas:**  
- `[#23]` [HU-05][Pruebas] Ejecutar CP-04, CP-05 y CP-15  
- `[#39]` [HU-08][Pruebas] Ejecutar CP-18  

---

## 1. CP-04: Cambiar a Estado Válido
- **Historia:** HU-05 (Cambiar el estado del caso)
- **Objetivo:** Verificar que un agente asignado pueda avanzar el estado de un caso siguiendo la máquina de estados permitida y que se registre el evento en el historial.
- **Precondiciones:** Caso en estado `PENDIENTE`, asignado al agente Andrés Pérez (`id: 3`).
- **Paso a paso:**
  1. Realizar solicitud `PATCH /api/casos/1/estado` con cabecera `X-Usuario-Id: 3`.
  2. Enviar cuerpo JSON:
     ```json
     { "estado": "EN_ANALISIS" }
     ```
- **Resultado Esperado:**
  - Código HTTP: `200 OK`.
  - El caso actualiza su campo `estado` a `"EN_ANALISIS"`.
  - Se crea un registro en `historial` con `evento: "CAMBIO_ESTADO"`, `estadoAnterior: "PENDIENTE"`, `estadoNuevo: "EN_ANALISIS"` y el usuario responsable.
- **Resultado Obtenido:** Exitoso. Código HTTP 200 retornado. Estado actualizado e historial registrado correctamente.
- **Estado:** ✅ APROBADO

---

## 2. CP-05: Intentar Transición Inválida
- **Historia:** HU-05 (Cambiar el estado del caso)
- **Objetivo:** Verificar que el sistema impida transiciones no permitidas en la máquina de estados.
- **Precondiciones:** Caso en estado `PENDIENTE`.
- **Paso a paso:**
  1. Intentar pasar directamente un caso de `PENDIENTE` a `CERRADA`.
  2. Realizar solicitud `PATCH /api/casos/2/estado` con cabecera `X-Usuario-Id: 3`.
  3. Enviar cuerpo JSON:
     ```json
     { "estado": "CERRADA" }
     ```
- **Resultado Esperado:**
  - Código HTTP: `400 VALIDACION` o `409 TRANSICION_INVALIDA`.
  - La respuesta contiene:
    ```json
    {
      "error": "VALIDACION",
      "mensaje": "Estado no válido para transición manual (CERRADA solo se alcanza mediante validación)",
      "detalles": [...]
    }
    ```
  - El caso mantiene su estado `PENDIENTE`.
- **Resultado Obtenido:** Exitoso. El sistema rechazó la solicitud impidiendo la transición no autorizada.
- **Estado:** ✅ APROBADO

---

## 3. CP-15: Reclasificación del Caso según Estado (RN-08)
- **Historia:** HU-05 (Reclasificación)
- **Objetivo:** Comprobar que solo se permite reclasificar (tipo, categoría, prioridad) mientras el caso está en `PENDIENTE` o `EN_ANALISIS`, y que se rechaza si ya está en `EN_ATENCION` o posterior.
- **Paso a paso:**
  1. Caso en `PENDIENTE` (`id: 2`): Reclasificar prioridad de `P3` a `P1`.
     - Petición: `PATCH /api/casos/2/clasificacion` (o actualización de categoría/prioridad).
     - Resultado: Se actualiza con éxito (200 OK) y genera evento de historial.
  2. Caso en `EN_ATENCION` (`id: 1`): Intentar cambiar categoría o prioridad.
     - Resultado esperado: `409 ESTADO_NO_PERMITE_OPERACION`.
     - Mensaje: `"La operación no aplica en el estado actual"`.
- **Resultado Obtenido:** Exitoso. En estados iniciales se permite la reclasificación; una vez en atención, el sistema bloquea modificaciones estructurales.
- **Estado:** ✅ APROBADO

---

## 4. CP-18: Consulta y Consistencia del Historial (HU-08)
- **Historia:** HU-08 (Consultar el historial)
- **Objetivo:** Verificar que la línea de tiempo del caso refleje todos los eventos en orden cronológico con sus autores, cambios de estado y comentarios.
- **Precondiciones:** Caso `id: 3` que ha pasado por ciclo: Creación -> Asignación -> Atención -> Devolución/Validación.
- **Paso a paso:**
  1. Realizar solicitud `GET /api/casos/3/historial` con cabecera `X-Usuario-Id: 5` (Validador Sofía Rojas).
- **Resultado Esperado:**
  - Código HTTP: `200 OK`.
  - Array con la traza de auditoría completa:
    1. `CREACION`: Laura Méndez, `estadoNuevo: "PENDIENTE"`.
    2. `ASIGNACION`: Andrés Pérez, `comentario: "Asignado a Andrés Pérez"`.
    3. `ATENCION`: Andrés Pérez, `estadoAnterior: "EN_ATENCION"`, `estadoNuevo: "EN_VALIDACION"`.
    4. `DEVOLUCION` o `APROBACION`: Sofía Rojas, con comentario registrado.
  - Campos presentes: `id`, `casoId`, `evento`, `estadoAnterior`, `estadoNuevo`, `usuario`, `fecha`, `comentario`.
- **Resultado Obtenido:** Exitoso. Toda la trazabilidad histórica se almacena fielmente con timestamps ISO 8601 en UTC.
- **Estado:** ✅ APROBADO
