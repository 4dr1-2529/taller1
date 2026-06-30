# Reporte final de pruebas — Tesis Dashboard v2.0

**Generado:** 2026-06-30  
**Ambiente:** Local exclusivo (MySQL XAMPP, API `:4000`, Web `:3029`, ML `:5000`)  
**Norma:** ISO/IEC 29119  
**Pipeline:** `npm run qa:pipeline`

---

## Resumen general

Se completó el plan de pruebas con **ejecución real** contra código y datos demo del proyecto (660 estudiantes, 23 profesores, 19 680 notas bimestre I–II). Incluye pruebas unitarias (31 backend + 6 ML), smoke API, caja negra/seguridad/integración HTTP, rendimiento medido, auditoría caja blanca (41 archivos), capturas Playwright **20/20** (Director, Profesor, Alumno) y validación `type-check` / `build` / `test`.

## Totales

| Métrica | Valor |
|---------|-------|
| Casos en matriz | **86** |
| Aprobados | **84** |
| Observados | **2** (TC-BE-09 refresh token, TC-DB-06 matrícula POST dedicado) |
| Fallidos | **0** |
| Capturas UI | **20** PNG en `evidencias-finales/capturas/` |
| Tests unitarios backend | 31 pass |
| Tests ML pytest | 6 pass |
| Smoke API | 4/4 pass |

## Evidencias generadas

| Carpeta | Contenido |
|---------|-----------|
| `evidencias-finales/capturas/` | Login, dashboards 3 roles, notas, predicción, alertas, reportes |
| `evidencias-finales/api/` | health, login 3 roles, 401/403, KPIs, students, predict |
| `evidencias-finales/terminal/` | type-check.log, build.log, test.log |
| `evidencias-finales/rendimiento/` | performance-report.json |
| `pruebas-unitarias/evidencias/` | backend-tests.log, smoke-tests.log, ml-tests.log |
| `pruebas-seguridad/evidencias/` | JWT, RBAC docente/estudiante |
| `pruebas-integracion/evidencias/` | predictions-historial, predict-student |
| `pruebas-caja-blanca/evidencias/` | auditoria-caja-blanca.json |

## Módulos validados

- Autenticación JWT (login Director, Profesor, Alumno)
- Dashboard KPIs director (`byLevel` en envelope `data`)
- Gestión listados: estudiantes, profesores, cursos, asignaciones
- Notas bimestre I (director + profesor) y vista alumno
- Predicción IA end-to-end (FastAPI → API → UI)
- Alertas tempranas (director + profesor)
- Reportes (vista exportación)
- RBAC: 401 sin token, 401 token inválido, 403 docente/estudiante
- Modelo ML ensemble (RF + XGBoost + Stacking)

## Rendimiento (promedio local, 3 muestras)

| Endpoint | ms |
|----------|-----|
| GET /health | 16 |
| POST /auth/login director | 1836 |
| GET /dashboard/kpis | 617 |
| GET /students?limit=100 | 520 |
| POST /predict (IA) | 563 |
| GET /predictions | 84 |

Detalle: `pruebas-rendimiento/evidencias/performance-report.json`

## Riesgos encontrados

1. **Login UI director** — En sesiones largas el formulario puede timeout; capturas usan inyección API + formulario inicial documentado.
2. **TC-BE-09 / TC-DB-06** — Casos observados pendientes de script POST dedicado (refresh token, matrícula).
3. **Rendimiento** — Depende de hardware; login director ~1.8s (bajo umbral 2s).

## Recomendaciones

1. Ejecutar `npm run qa:pipeline` antes de cada entrega.
2. Mantener `npm run db:seed:demo` para datos coherentes.
3. Añadir test automatizado para `POST /auth/refresh` y `POST /matriculas`.

## Conclusión

El sistema **cumple** los criterios de salida del plan ISO 29119 en ambiente local. La matriz de 86 casos tiene trazabilidad completa en `matriz-pruebas/matriz-casos.xlsx` con evidencias nombradas y rutas reales. No se usaron Railway ni Vercel.

**Responsable:** QA Senior — plan-pruebas
