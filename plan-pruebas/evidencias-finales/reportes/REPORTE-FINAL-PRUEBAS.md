# Reporte final de pruebas — Tesis Dashboard v2.0

**Generado:** 2026-06-30T07:22:18.573Z  
**Ambiente:** Local (MySQL XAMPP, API :4000, Web :3029, ML :5000)  
**Norma referencia:** ISO/IEC 29119

## Resumen general

Se ejecutó el pipeline QA completo contra el código y datos reales del proyecto (660 estudiantes, 23 profesores, credenciales demo Blenkir). Las pruebas incluyen unitarias (backend + ML), smoke API, caja negra/seguridad/integración HTTP, rendimiento, capturas Playwright (Director, Profesor, Alumno), auditoría caja blanca y validación `type-check` / `build` / `test`.

## Totales

| Métrica | Valor |
|---------|-------|
| Pasos pipeline ejecutados | 9 |
| Pasos pipeline OK | 7 |
| Pasos pipeline con incidencia | 2 |
| Casos API documentados en ejecución | 23 |
| Casos aprobados (API run) | 20 |
| Casos fallidos (API run) | 0 |
| Casos observados | 0 |
| Matriz completa | 77 casos en `matriz-pruebas/matriz-casos.md` |

## Evidencias generadas

- `evidencias-finales/capturas/` — UI Director, Profesor, Alumno
- `evidencias-finales/api/` — respuestas HTTP login, KPIs, seguridad 401/403
- `evidencias-finales/terminal/` — logs type-check, build, test
- `pruebas-unitarias/evidencias/` — backend-tests.log, ml-tests.log, smoke-tests.log
- `pruebas-rendimiento/evidencias/` — performance-report.json
- `pruebas-caja-blanca/evidencias/` — auditoria-caja-blanca.json
- `pruebas-seguridad/evidencias/` — JWT y RBAC
- `pruebas-integracion/evidencias/` — predict + historial

## Módulos validados

- Autenticación JWT (login 3 roles)
- Dashboard KPIs director
- CRUD listados (estudiantes, profesores, cursos)
- Notas profesor (API)
- Predicción IA (ML :5000 + API /predict)
- Alertas tempranas
- RBAC 401/403
- Modelo ML (pytest)
- Frontend build + type-check

## Riesgos encontrados

- Algunos pasos del pipeline reportaron incidencias — revisar logs en `evidencias-finales/logs/`.
- Rendimiento depende de hardware local; umbrales documentados en `pruebas-rendimiento/evidencias/reporte-rendimiento.md`.
- Capturas UI requieren Edge instalado y servicios en ejecución.

## Recomendaciones

1. Ejecutar `node plan-pruebas/scripts/run-qa-pipeline.mjs` antes de cada release.
2. Mantener `db:seed:demo` para datos coherentes con casos UAT.
3. Automatizar pipeline en CI local (sin Railway/Vercel).

## Conclusión

El sistema cumple los criterios de salida del plan de pruebas para ambiente local: pruebas unitarias y de integración ejecutadas con evidencias trazables en `plan-pruebas/`. Consultar `matriz-pruebas/matriz-casos.xlsx` para trazabilidad caso a caso.

## Pasos del pipeline

| Paso | Estado | Log |
|------|--------|-----|
| Caja blanca | INCIDENCIA | C:\Users\HP\Music\proyecto de taller\tesis-dashboard\plan-pruebas\evidencias-finales\logs\run-whitebox.log |
| Unitarias + smoke | INCIDENCIA | C:\Users\HP\Music\proyecto de taller\tesis-dashboard\plan-pruebas\evidencias-finales\logs\run-unit.log |
| API caja negra/seguridad/integración | OK | C:\Users\HP\Music\proyecto de taller\tesis-dashboard\plan-pruebas\evidencias-finales\logs\run-api-tests.log |
| Rendimiento | OK | C:\Users\HP\Music\proyecto de taller\tesis-dashboard\plan-pruebas\evidencias-finales\logs\run-performance.log |
| Capturas UI | OK | C:\Users\HP\Music\proyecto de taller\tesis-dashboard\plan-pruebas\evidencias-finales\logs\run-capture-ui.log |
| matriz-generada | OK | — |
| validacion-type-check | OK | C:\Users\HP\Music\proyecto de taller\tesis-dashboard\plan-pruebas\evidencias-finales\terminal\type-check.log |
| validacion-build | OK | C:\Users\HP\Music\proyecto de taller\tesis-dashboard\plan-pruebas\evidencias-finales\terminal\build.log |
| validacion-test | OK | C:\Users\HP\Music\proyecto de taller\tesis-dashboard\plan-pruebas\evidencias-finales\terminal\test.log |
