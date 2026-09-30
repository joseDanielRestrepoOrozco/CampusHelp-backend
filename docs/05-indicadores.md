# Documentación Técnica: Cálculo de Indicadores del Servicio (HU-10)

**Historia de Usuario:** HU-10 · Indicadores del servicio  
**Tarea:** [#48] Documentar cómo se calcula cada indicador  
**Responsable:** Juan Fernando  
**Endpoint:** `GET /api/indicadores` (o `GET /indicadores`)  
**Cabecera obligatoria:** `X-Usuario-Id: <id>` (requiere usuario activo en el sistema)  
**Parámetros de consulta opcionales:**  
- `desde`: Fecha/hora inicial en formato ISO 8601 UTC (ej. `2026-10-01T00:00:00Z`).
- `hasta`: Fecha/hora final en formato ISO 8601 UTC (ej. `2026-10-03T23:59:59Z`).

---

## 1. Resumen del Formato de Salida

```json
{
  "total": 42,
  "porEstado": {
    "PENDIENTE": 5,
    "EN_ANALISIS": 3,
    "EN_ATENCION": 6,
    "EN_VALIDACION": 2,
    "CERRADA": 26
  },
  "porTipo": {
    "INCIDENTE": 30,
    "SOLICITUD": 12
  },
  "porPrioridad": {
    "P1": 8,
    "P2": 25,
    "P3": 9
  },
  "porArea": [
    { "area": "Red y conectividad", "cantidad": 15 },
    { "area": "Hardware", "cantidad": 12 },
    { "area": "Software", "cantidad": 8 },
    { "area": "Cuentas y acceso", "cantidad": 4 },
    { "area": "Plataformas académicas", "cantidad": 3 }
  ],
  "promedioHorasHastaAsignacion": 3.4,
  "promedioHorasResolucion": 27.8,
  "devoluciones": 4
}
```

---

## 2. Detalle de Cálculo por Indicador

### 2.1. `total` (Total de Casos)
- **Definición:** Conteo total de casos registrados dentro del intervalo de tiempo evaluado.
- **Fórmula:**
  $$\text{total} = \sum_{c \in \text{Casos}} 1$$
- **Filtro temporal:** Se consideran únicamente aquellos casos donde `fechaCreacion >= desde` y `fechaCreacion <= hasta` (si se envían).
- **Consulta SQL equivalente:**
  ```sql
  SELECT COUNT(*) AS total
  FROM caso
  WHERE (:desde IS NULL OR fecha_creacion >= :desde)
    AND (:hasta IS NULL OR fecha_creacion <= :hasta);
  ```

---

### 2.2. `porEstado` (Distribución por Estado Actual)
- **Definición:** Diccionario con la cantidad de casos existentes clasificados en cada uno de los 5 estados del ciclo de vida: `PENDIENTE`, `EN_ANALISIS`, `EN_ATENCION`, `EN_VALIDACION` y `CERRADA`.
- **Fórmula:** Para cada estado $e \in \{\text{PENDIENTE}, \text{EN\_ANALISIS}, \text{EN\_ATENCION}, \text{EN\_VALIDACION}, \text{CERRADA}\}$:
  $$\text{porEstado}[e] = \sum_{c \in \text{Casos}, c.\text{estado} = e} 1$$
- **Consulta SQL equivalente:**
  ```sql
  SELECT estado, COUNT(*) AS cantidad
  FROM caso
  WHERE (:desde IS NULL OR fecha_creacion >= :desde)
    AND (:hasta IS NULL OR fecha_creacion <= :hasta)
  GROUP BY estado;
  ```

---

### 2.3. `porTipo` (Distribución por Tipo de Requerimiento)
- **Definición:** Conteo de casos divididos entre `INCIDENTE` (falla técnica) y `SOLICITUD` (petición de servicio).
- **Fórmula:**
  $$\text{porTipo}[\text{INCIDENTE}] = \sum_{c.\text{tipo} = \text{'INCIDENTE'}} 1$$
  $$\text{porTipo}[\text{SOLICITUD}] = \sum_{c.\text{tipo} = \text{'SOLICITUD'}} 1$$
- **Consulta SQL equivalente:**
  ```sql
  SELECT tipo, COUNT(*) AS cantidad
  FROM caso
  GROUP BY tipo;
  ```

---

### 2.4. `porPrioridad` (Distribución por Nivel de Prioridad)
- **Definición:** Agrupación de casos según el nivel de urgencia/impacto asignado: `P1` (urgente), `P2` (normal), `P3` (baja).
- **Fórmula:** Conteo por valor de `prioridad` en el conjunto de casos filtrados.
- **Consulta SQL equivalente:**
  ```sql
  SELECT prioridad, COUNT(*) AS cantidad
  FROM caso
  GROUP BY prioridad;
  ```

---

### 2.5. `porArea` (Distribución por Área de Soporte)
- **Definición:** Lista de objetos con el nombre del área (`area`) y la cantidad de casos pertenecientes a ella (`cantidad`), facilitando la visualización en gráficos de barras o pastel.
- **Consulta SQL equivalente:**
  ```sql
  SELECT a.nombre AS area, COUNT(c.id) AS cantidad
  FROM area a
  LEFT JOIN categoria cat ON cat.area_id = a.id
  LEFT JOIN caso c ON c.categoria_id = cat.id
  GROUP BY a.id, a.nombre;
  ```

---

### 2.6. `promedioHorasHastaAsignacion` (Tiempo Promedio de Asignación)
- **Definición:** Promedio en horas transcurridas desde el momento en que se registró el caso (`fechaCreacion`) hasta que un agente fue asignado (`fechaAsignacion`).
- **Población evaluada:** Solo aplica para casos que **hayan sido asignados** (`fechaAsignacion IS NOT NULL`).
- **Fórmula:**
  $$\text{promedioHorasHastaAsignacion} = \frac{\sum_{c \in \text{CasosAsignados}} \left( \text{fechaAsignacion}_c - \text{fechaCreacion}_c \right)_{\text{horas}}}{|\text{CasosAsignados}|}$$
  Si no hay casos asignados, el valor retornado es `0`. Se redondea a un decimal.
- **Consulta SQL equivalente:**
  ```sql
  SELECT ROUND(AVG(EXTRACT(EPOCH FROM (fecha_asignacion - fecha_creacion)) / 3600.0)::numeric, 1) AS promedio_horas_asignacion
  FROM caso
  WHERE fecha_asignacion IS NOT NULL;
  ```

---

### 2.7. `promedioHorasResolucion` (Tiempo Promedio de Resolución)
- **Definición:** Promedio en horas transcurridas desde la creación del caso (`fechaCreacion`) hasta su cierre definitivo tras la validación aprobada (`fechaCierre`).
- **Población evaluada:** Solo aplica para casos en estado `CERRADA` con `fechaCierre IS NOT NULL`.
- **Fórmula:**
  $$\text{promedioHorasResolucion} = \frac{\sum_{c \in \text{CasosCerrados}} \left( \text{fechaCierre}_c - \text{fechaCreacion}_c \right)_{\text{horas}}}{|\text{CasosCerrados}|}$$
  Si no hay casos cerrados, el valor retornado es `0`. Se redondea a un decimal.
- **Consulta SQL equivalente:**
  ```sql
  SELECT ROUND(AVG(EXTRACT(EPOCH FROM (fecha_cierre - fecha_creacion)) / 3600.0)::numeric, 1) AS promedio_horas_resolucion
  FROM caso
  WHERE estado = 'CERRADA' AND fecha_cierre IS NOT NULL;
  ```

---

### 2.8. `devoluciones` (Cantidad de Devoluciones de Calidad)
- **Definición:** Número total de veces que un validador rechazó la solución entregada por el agente de soporte, devolviendo el caso de `EN_VALIDACION` a `EN_ATENCION`.
- **Fuente de datos:** Tabla `historial`. Se contabilizan todas las filas con evento `DEVOLUCION`.
- **Fórmula:**
  $$\text{devoluciones} = \sum_{h \in \text{Historial}, h.\text{evento} = \text{'DEVOLUCION'}} 1$$
- **Consulta SQL equivalente:**
  ```sql
  SELECT COUNT(*) AS devoluciones
  FROM historial
  WHERE evento = 'DEVOLUCION';
  ```

---

## 3. Consideraciones de Negocio y Rendimiento
1. **Índices recomendados:**
   - Índice sobre `caso(fecha_creacion)` para filtrado rápido por rangos.
   - Índice sobre `caso(estado)` y `caso(agente_id)`.
   - Índice sobre `historial(caso_id, evento)`.
2. **Zona horaria:** Todos los cálculos se efectúan en UTC para evitar desfases por horario de verano o zonas locales.
