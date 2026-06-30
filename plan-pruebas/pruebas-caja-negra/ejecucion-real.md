# Pruebas de caja negra — Ejecución real

**Fecha:** 2026-06-30  
**Script:** `plan-pruebas/scripts/run-api-tests.mjs` + `run-capture-ui.mjs`

## API (sin revisar código interno)

| Caso | Resultado | Evidencia |
|------|-----------|-----------|
| Login Director | 200 JWT | `evidencias-finales/api/login-director-200.json` |
| Login Profesor | 200 JWT | `evidencias-finales/api/login-profesor-200.json` |
| Login Alumno | 200 JWT | `evidencias-finales/api/login-alumno-200.json` |
| Login inválido | HTTP 400 | `evidencias-finales/api/login-invalido-400.json` |
| KPIs dashboard | 200 byLevel | `evidencias-finales/api/dashboard-kpis.json` |
| Listado estudiantes | items paginados | `evidencias-finales/api/students-list.json` |
| Listado profesores | HTTP 200 | `evidencias-finales/api/teachers-list.json` |
| Alertas | HTTP 200 | `evidencias-finales/api/alerts-list.json` |

## UI Playwright (20 capturas)

Director: dashboard, profesores, estudiantes, cursos, notas B1, predicción, alertas, reportes, asignaciones.  
Profesor: dashboard, notas, alertas.  
Alumno: dashboard, mis notas, mi asistencia, mi riesgo.

Manifest: `evidencias-finales/capturas/manifest.json`  
Casos JSON por pantalla: `pruebas-caja-negra/evidencias/*.json`
