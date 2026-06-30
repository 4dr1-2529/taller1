# Cronograma de pruebas

**Versión sistema:** 2.0.0 · **Total casos:** 65 (ver `matriz-pruebas/matriz-casos.md`)

---

## Fases ISO/IEC 29119

| Fase | Actividad | Entregable | Comando / artefacto |
|------|-----------|------------|---------------------|
| **1. Planificación** | Definir alcance, riesgos, recursos | `plan-general/*` | Este repositorio |
| **2. Diseño** | Casos por capa (unitaria, CN, CB, integración) | `pruebas-*/`, matriz 65 casos | `matriz-casos.xlsx` |
| **3. Implementación** | Suites automatizadas | 11 archivos `backend/tests/` | `npm run test:backend` |
| **4. Ejecución** | Corrida local + smoke + capturas | Logs QA, PNG | `npm run test`, `npm run test:smoke`, `npm run evidence:generate` |
| **5. Reporte** | Resumen PASS/FAIL + evidencias | `docs/evidencias_finales/qa/RESUMEN-QA.md` | Matriz actualizada |

---

## Secuencia de ejecución local (orden obligatorio)

| Orden | Día | Actividad | Dependencia |
|-------|-----|-----------|-------------|
| 1 | D1 | `npm run db:push` + `db:seed` + `db:seed:demo` | MySQL XAMPP activo |
| 2 | D1 | `npm run ml:train` | Python 3.11+ |
| 3 | D2 | `npm run type-check` + `npm run test:backend` + `npm run ml:test` | — |
| 4 | D2 | `npm run lint` + `npm run build` | — |
| 5 | D3 | Levantar `dev:api`, `dev:web`, `dev:ml` | `.env` configurado |
| 6 | D3 | `npm run test:smoke` | Servicios :4000, :5000 |
| 7 | D4 | UAT manual Director / Profesor / Estudiante | Credenciales demo |
| 8 | D4 | `npm run evidence:generate` | Playwright + Edge |
| 9 | D5 | Actualizar matriz (Resultado obtenido / Estado) | Revisión QA |

---

## Hitos de aceptación

| Hito | Criterio | Casos asociados |
|------|----------|-----------------|
| H1 — Unitarias verdes | 0 fallos en `npm run test` | TC-BE-*, TC-IA-*, TC-SEC-* (automatizados) |
| H2 — Integración smoke | `smoke-tests.mjs` exit 0 | TC-INT-01 … TC-INT-08 |
| H3 — UAT 3 roles | Checklists `pruebas-aceptacion/` completados | TC-UAT-* |
| H4 — Evidencias | `docs/evidencias_finales/` ≥ 129 archivos | TC-CN-* con captura |
