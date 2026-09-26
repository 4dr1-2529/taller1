# ISO/IEC 29119 — Plan de pruebas (referencia normativa)

**Proyecto:** Tesis Dashboard v2.0  
**Norma:** ISO/IEC 29119  
**Versión:** 2.0

---

**Leyenda de estado:** ✅ Verificado (ejecutado y con evidencia reproducible) · 🔄 Parcial (ejecutado parcialmente) · 📋 Planificado (no ejecutado) · ⛔ BLOQUEADO (no ejecutable desde este entorno).

Este documento ISO permanece en `docs/` como **referencia normativa**. El plan operativo completo (**86 casos**: 80 aprobados, 6 observados, 0 fallidos) está en la **raíz del repositorio**:

| Recurso | Ubicación |
|---------|-----------|
| **Índice principal** | [plan-pruebas/README.md](../../plan-pruebas/README.md) |
| **Plan formal (86 casos)** | [plan-pruebas/plan-general/plan-pruebas.md](../../plan-pruebas/plan-general/plan-pruebas.md) |
| **Matriz de casos** | [plan-pruebas/matriz-pruebas/matriz-casos.md](../../plan-pruebas/matriz-pruebas/matriz-casos.md) |
| **Trazabilidad** | [plan-pruebas/matriz-pruebas/trazabilidad.md](../../plan-pruebas/matriz-pruebas/trazabilidad.md) |
| **Evidencias finales** | [plan-pruebas/evidencias-finales/](../../plan-pruebas/evidencias-finales/) |

---

## Resumen ISO 29119

| Fase | Documento en `plan-pruebas/` |
|------|------------------------------|
| Planificación | `plan-general/` (alcance, estrategia, ambiente) |
| Diseño | `matriz-pruebas/`, `pruebas-caja-negra/`, `pruebas-caja-blanca/` |
| Ejecución | `pruebas-unitarias/`, `pruebas-integracion/`, `pruebas-aceptacion/` |
| Reporte | `evidencias-finales/`, `resultados/verificacion-stack.json` |

---

## Trazabilidad código — ISO/IEC 29119

| Norma | Característica | Módulo | Archivo | Implementación | Evidencia | Estado |
|-------|----------------|--------|---------|----------------|-----------|--------|
| ISO/IEC 29119 | Planificación — alcance | Plan general | `plan-pruebas/plan-general/alcance.md` | 109 rutas API (82 con `authorize()`), 3 roles, stack 3029/4000/5000 | `indice-pruebas.md` | ✅ Verificado |
| ISO/IEC 29119 | Planificación — riesgos | Riesgos | `plan-pruebas/plan-general/riesgos.md` | R-01..R-08 con mitigación | Matriz vinculada TC-* | ✅ Verificado |
| ISO/IEC 29119 | Planificación — ambiente | Ambiente | `plan-pruebas/plan-general/ambiente-pruebas.md` | XAMPP MySQL, Node 20, Python ML | `verificacion-stack.json` | ✅ Verificado |
| ISO/IEC 29119 | Diseño — casos de prueba | Matriz | `plan-pruebas/matriz-pruebas/matriz-casos.md` | 86 casos TC-BE/FE/IA/CN/INT/SEC/UAT — 80 aprobados, 6 observados, 0 fallidos | `matriz-casos.xlsx` (`generate_matriz.py`) | ✅ Verificado |
| ISO/IEC 29119 | Diseño — caja negra login | Login | `plan-pruebas/pruebas-caja-negra/login.md` | TC-CN-01, TC-BE-02 | `evidencias-finales/login/login.png` | ✅ Verificado |
| ISO/IEC 29119 | Diseño — caja negra dashboard | Dashboard | `plan-pruebas/pruebas-caja-negra/dashboard.md` | TC-FE-03..05 `ROLE_SECTIONS` | `evidencias-finales/dashboard/dashboard.png` | ✅ Verificado |
| ISO/IEC 29119 | Diseño — caja negra predicción | Predicción | `plan-pruebas/pruebas-caja-negra/prediccion.md` | TC-CN-07, TC-IA-08 | `evidencias-finales/prediccion/prediccion.png` | ✅ Verificado |
| ISO/IEC 29119 | Diseño — caja blanca API | Rutas | `plan-pruebas/pruebas-caja-blanca/api.md` | Mapa `routes/index.ts` | `backend/src/routes/index.ts` | ✅ Verificado |
| ISO/IEC 29119 | Ejecución — pruebas unitarias backend | Backend | `backend/tests/*.test.{mjs,ts}` | 81 tests Node (`npm run test:backend`) | Ejecución 2026-09-26: 81 pass / 0 fail | ✅ Verificado |
| ISO/IEC 29119 | Ejecución — pruebas unitarias IA | ML | `machine-learning/tests/test_predict.py` | Vector 7D, umbrales 0.41/0.65, endpoint | `npm run ml:test` — 32 OK (2026-09-26) | ✅ Verificado |
| ISO/IEC 29119 | Ejecución — integración FE-BE | Auth + API | `plan-pruebas/pruebas-integracion/frontend-backend.md` | TC-INT-02 login + historial | `frontend/src/services/api.ts` | ✅ Verificado |
| ISO/IEC 29119 | Ejecución — integración BE-IA | ML client | `plan-pruebas/pruebas-integracion/backend-ia.md` | `predictWithMl()` → FastAPI | `verify-stack.mjs` IA predict | ✅ Verificado |
| ISO/IEC 29119 | Ejecución — integración BE-BD | Prisma | `plan-pruebas/pruebas-integracion/backend-bd.md` | Login + `GET /students` post-seed | `verificacion-stack.json` BD PASS | ✅ Verificado |
| ISO/IEC 29119 | Ejecución — smoke | Smoke | `backend/scripts/smoke-tests.mjs` | Health, ML predict 3 perfiles, login | Ejecución 2026-09-26: exit 1, faltan `DIRECTOR/TEACHER/STUDENT_INITIAL_PASSWORD` | ⛔ BLOQUEADO |
| ISO/IEC 29119 | Ejecución — seguridad JWT | JWT/RBAC | `plan-pruebas/pruebas-seguridad/jwt.md` | TC-SEC-03..05 tokens y roles | `permissions.test.mjs` | ✅ Verificado |
| ISO/IEC 29119 | Ejecución — aceptación director | UAT admin | `plan-pruebas/pruebas-aceptacion/director.md` | `director@blenkir.edu.pe` - 20 secciones vigentes (la ejecución registrada cubrió 14) | 11 capturas `evidencias-finales/` | ✅ Verificado |
| ISO/IEC 29119 | Ejecución — aceptación profesor | UAT docente | `plan-pruebas/pruebas-aceptacion/profesor.md` | `pro50000001@blenkir.edu.pe` ámbito salón | `teacher-scope.test.ts` | ✅ Verificado |
| ISO/IEC 29119 | Ejecución — aceptación estudiante | UAT estudiante | `plan-pruebas/pruebas-aceptacion/estudiante.md` | `mateo.quispe0001@blenkir.edu.pe` - 12 secciones vigentes (la ejecución registrada cubrió 6) | `estudiante-scope.test.ts` | ✅ Verificado |
| ISO/IEC 29119 | Reporte — evidencias UI | Capturas | `scripts/evidence/capture-ui.mjs` | Playwright Edge, 11 módulos | `capturas-manifest.json` | ✅ Verificado |
| ISO/IEC 29119 | Reporte — evidencias stack | Verificación | `scripts/evidence/verify-stack.mjs` | 5 checks automatizados | `resultados/verificacion-stack.json` | ✅ Verificado |
| ISO/IEC 29119 | Reporte — trazabilidad | Matriz | `plan-pruebas/matriz-pruebas/trazabilidad.md` | Requisito ↔ código ↔ caso ↔ evidencia | Enlace cruzado ISO 9001/25010 | ✅ Verificado |

---

## Pruebas de software frente a métricas ML

La norma 29119 reporta **pruebas de software** (suites, ejecuciones, cobertura). No confundir con el
desempeño estadístico del modelo:

| Tipo | Qué mide | Resultado 2026-09-26 | Fuente canónica |
|------|----------|----------------------|-----------------|
| Pruebas de software | ¿el código se comporta como se especifica? | 81 backend + 40 frontend + 4 unitarias + 32 ML **en verde**; 39 de integración en BD aislada; matriz **86/80/6/0** | `plan-pruebas/matriz-pruebas/matriz-casos.md` |
| Métricas ML | ¿el modelo clasifica bien? | No son pruebas de software: se reportan aparte | `docs/ml/RESULTADOS_EXPERIMENTALES_V6.md` y `machine-learning/artifacts/synthetic/metrics.json` |

Las métricas ML corresponden a un modelo **experimental** entrenado con datos científico-sintéticos
(`dataMode=synthetic_scientific`); un F1 alto o bajo no "aprueba ni suspende" el software, y una suite en
verde no valida la calidad predictiva.

---

## Referencias cruzadas

- [Calidad ISO 25010](../iso-25010/calidad-software.md)
- [Macroproceso ISO 9001](../iso-9001/macroproceso-academico.md)
- [Trazabilidad](../../plan-pruebas/matriz-pruebas/trazabilidad.md)
- [Evidencias QA](../../plan-pruebas/evidencias-finales/README.md)
