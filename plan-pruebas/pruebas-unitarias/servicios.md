# Pruebas unitarias — Servicios

Capa `backend/src/services/` — lógica de negocio detrás de controladores.

---

## Servicios identificados en código

| Servicio | Función real | Consumido por |
|----------|--------------|---------------|
| `ml-client.ts` | `predictRemote()`, `getMlMetrics()` — HTTP a FastAPI :5000 | `predict.controller`, `GET /ml/metrics` |
| `dashboard-analytics.service.ts` | Agregación KPIs `byLevel`, totales en una consulta | `dashboardStats` |
| `profesor-dashboard.service.ts` | KPIs ámbito docente | `profesorDashboard` |
| `teacher-assignment.service.ts` | Tutoría, polidocencia, validación pares | `teacher-assignments.controller` |
| `prediction.service.ts` | Orquesta features + persistencia `prediction` | `predict` |
| `grade.service.ts` | CRUD notas bimestrales | `grades.controller` |

---

## Condiciones y ramas (caja blanca)

### `ml-client.ts`

| Condición | Rama | Resultado |
|-----------|------|-----------|
| ML `:5000` responde | `predictRemote` OK | `probabilidad_abandono` en respuesta |
| ML caído | catch / fallback | Heurística local o error controlado |
| `metrics.json` ausente | `getMlMetrics` | `{ message: "ML service no disponible" }` |

### `teacher-assignment.service.ts`

| Condición | Rama | Validación |
|-----------|------|------------|
| `esTutor: true` | Una tutoría por sección | `teacher-course-pairs.ts` seed |
| Polidocencia | Mismo profe varios cursos | `config/polidocencia.ts` |

### `dashboard-analytics.service.ts`

| Condición | Rama | TC |
|-----------|------|-----|
| 660 estudiantes activos | count total | TC-CN-02 smoke `byLevel` |
| Sin predicciones | KPI riesgo = 0 | edge case manual |

---

## Tests indirectos

- `teacher-scope.test.ts` — lógica replicada de filtro Prisma usada en servicios profesor
- `smoke-tests.mjs` — integración real `dashboard-analytics` vía `GET /dashboard/kpis`
