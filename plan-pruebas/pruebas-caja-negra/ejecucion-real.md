# Pruebas de caja negra — Ejecución real

**Fecha:** 2026-06-30  
**Script:** `plan-pruebas/scripts/run-api-tests.mjs` + `run-capture-ui.mjs`

> Los snapshots API de este ciclo que contenían la población anterior se retiraron el 2026-11-10.
> Se deben regenerar contra una BD aislada preparada con Data Seed V6 antes de reutilizar estos casos.

## API (sin revisar código interno)

| Caso | Resultado | Evidencia |
|------|-----------|-----------|
| Login Director | 200 JWT | `evidencias-finales/api/login-director-200.json` |
| Login Profesor | 200 JWT | `evidencias-finales/api/login-profesor-200.json` |
| Login Alumno | 200 JWT | `evidencias-finales/api/login-alumno-200.json` |
| Login inválido | HTTP 400 | `evidencias-finales/api/login-invalido-400.json` |
| KPIs dashboard | 200 byLevel | Pendiente de reejecución con V6 |
| Listado estudiantes | 250 estudiantes V6, paginado | Pendiente de reejecución con V6 |
| Listado profesores | 24 docentes V6, paginado | Pendiente de reejecución con V6 |
| Alertas | HTTP 200 | Pendiente de reejecución con V6 |

## UI Playwright (20 capturas)

Director: dashboard, profesores, estudiantes, cursos, notas B1, predicción, alertas, reportes, asignaciones.  
Profesor: dashboard, notas, alertas.  
Alumno: dashboard, mis notas, mi asistencia, mi riesgo.

Manifest: `evidencias-finales/capturas/manifest.json`  
Casos JSON por pantalla: `pruebas-caja-negra/evidencias/*.json`
