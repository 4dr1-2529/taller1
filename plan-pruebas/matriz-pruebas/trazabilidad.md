# Matriz de trazabilidad

**77 casos** · Fuente: `matriz-pruebas/generate_matriz.py` (regenerar: `python generate_matriz.py`)

---

## Requisito → Código → Caso → Evidencia

| Requisito (funcional) | Implementación | Casos | Evidencia |
|----------------------|----------------|-------|-----------|
| Login JWT 3 roles | `auth.controller.ts`, `login/page.tsx` | TC-BE-02, TC-FE-02, TC-CN-01 | `evidencias-finales/login/login.png` |
| RBAC 87 rutas | `authorize()` en `routes/index.ts` | TC-SEC-03/04, TC-ROL-* | permissions.test.mjs |
| 660 estudiantes demo | `seed-demo.ts` | TC-DB-03, TC-CN-02 | check-db.mjs |
| Notas 0–20 bimestre | `gradeSchema`, `GradesView` | TC-CB-01, TC-CN-06 | notas-bimestre-*.png |
| Predicción ensemble | `ml-client.ts`, `PredictionView` | TC-IA-*, TC-CN-07 | `evidencias-finales/prediccion/prediccion.png` |
| Alertas automáticas | `predict` + tabla `alert` | TC-CN-08, TC-INT-03 | `evidencias-finales/alertas/alertas.png` |
| Reportes export | `ReportsView`, `export-reports.ts` | TC-CN-09 | `evidencias-finales/reportes/reportes.png` |
| Scope profesor | `teacher-scope.ts` | TC-ROL-05 | teacher-scope.test.ts |
| Scope estudiante | `estudiante-scope.ts` | TC-SEC-05 | estudiante-scope.test.ts |
| Formato tesis ES | mapeo predict response | TC-IA-06 | prediction-format.test.mjs |
| KPIs dashboard | `dashboard-analytics.service.ts` | TC-BE-07, TC-INT-02 | `evidencias-finales/dashboard/dashboard.png` |
| ML metrics UI | `MlMetricsSection`, `GET /ml/metrics` | TC-IA-09, TC-INT-07 | `evidencias-finales/ia/metricas-ml.json` |

---

## Trazabilidad ISO — índice por norma

| Norma | Documento canónico | Filas trazabilidad | Evidencia principal |
|-------|-------------------|-------------------|---------------------|
| ISO/IEC 25010 | `docs/iso-25010/calidad-software.md` §2 | 29 características de producto | Tests + `plan-pruebas/evidencias-finales/` |
| ISO 9001:2015 | `docs/iso-9001/macroproceso-academico.md` §10 | 19 cláusulas/procesos SGC | KPIs + capturas + seed demo |
| ISO/IEC 29119 | `docs/iso-29119/plan-pruebas.md` §Trazabilidad | 21 actividades de prueba | 77 casos + 31+6 tests + manifest |

---

## Tabla consolidada (muestra transversal)

| Norma | Característica | Módulo | Archivo | Implementación | Evidencia | Estado |
|-------|----------------|--------|---------|----------------|-----------|--------|
| ISO 9001 | 8.5 — Producción | Predicción | `predict.controller.ts` | Flujo estudiante → ML → alerta | `prediccion.png`, `alertas.png` | ✅ |
| ISO/IEC 25010 | Funcionalidad | Predicción | `PredictionView.tsx` | UI riesgo + factores ES | `capturas-manifest.json` | ✅ |
| ISO/IEC 29119 | Ejecución integración | BE-IA | `ml-client.ts` | TC-INT-06 smoke predict | `verify-stack.mjs` | ✅ |
| ISO 9001 | 7.5 — Documentado | Usuarios | `StudentsView.tsx` | Gestión estudiantes (UAT usuarios) | `usuarios-estudiantes.png` | ✅ |
| ISO/IEC 25010 | Seguridad | RBAC | `auth.ts` | JWT + `authorize()` | `permissions.test.mjs` | ✅ |
| ISO/IEC 29119 | Diseño caja negra | Configuración | `TeacherAssignmentsView.tsx` | TC-CN-10 asignaciones | `configuracion-asignaciones.png` | ✅ |

*Tablas completas por norma en los documentos enlazados arriba (sin duplicar filas).*

---

## Suites automatizadas → casos

| Comando | Archivos | Casos cubiertos |
|---------|----------|-----------------|
| `npm run test:backend` | 11 archivos en `backend/tests/` | TC-BE-*, TC-SEC-*, TC-ROL-*, TC-CB-* (31 tests) |
| `npm run ml:test` | `test_predict.py` | TC-IA-01 … TC-IA-06 |
| `npm run test:smoke` | `smoke-tests.mjs` | TC-INT-01 … TC-INT-03 |
| `npm run evidence:generate` | `scripts/evidence/` | TC-CN-* capturas → `plan-pruebas/evidencias-finales/` |
