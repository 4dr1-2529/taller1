# Reporte de ejecución — Pruebas unitarias

> **HISTÓRICO.** Ejecución del **2026-06-30**; los recuentos de esta tabla pertenecen a esa corrida.
> Cobertura vigente (2026-09-26): backend **81** pruebas, ML **32** pruebas, smoke **NO DISPONIBLE**
> (faltan `*_INITIAL_PASSWORD`). Log vigente: `pruebas-unitarias/evidencias/ml-tests.log`.

**Fecha:** 2026-06-30  
**Comando:** `node plan-pruebas/scripts/run-unit.mjs`

## Resultados

| Suite | Estado | Log |
|-------|--------|-----|
| Backend (`npm run test --workspace=backend`) | PASS | [backend-tests.log](evidencias/backend-tests.log) |
| Smoke API (`backend/scripts/smoke-tests.mjs`) | PASS | [smoke-tests.log](../evidencias-finales/terminal/smoke-tests.log) |
| ML (`npm run ml:test`) | PASS (6 tests) | [ml-tests.log](evidencias/ml-tests.log) |

## Cobertura real (archivos con tests)

- `backend/tests/schemas.test.ts` — loginSchema, gradeSchema, predictSchema, changePassword
- `backend/tests/permissions.test.mjs` — matriz RBAC 3 roles
- `backend/tests/teacher-scope.test.ts` — ámbito profesor
- `backend/tests/estudiante-scope.test.ts` — studentId ajeno
- `backend/tests/prediction-format.test.mjs` — formato tesis español
- `machine-learning/tests/test_predict.py` — features (7), umbrales y predict (sin heurística)

## Evidencia terminal

Ver también `../evidencias-finales/terminal/unit-tests-summary.json`
