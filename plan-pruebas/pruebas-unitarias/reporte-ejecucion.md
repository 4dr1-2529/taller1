# Reporte de ejecución — Pruebas unitarias

**Fecha:** 2026-06-30  
**Comando:** `node plan-pruebas/scripts/run-unit.mjs`

## Resultados

| Suite | Estado | Log |
|-------|--------|-----|
| Backend (`npm run test --workspace=backend`) | PASS | [backend-tests.log](backend-tests.log) |
| Smoke API (`backend/scripts/smoke-tests.mjs`) | PASS | [smoke-tests.log](smoke-tests.log) |
| ML (`npm run ml:test`) | PASS (6 tests) | [ml-tests.log](ml-tests.log) |

## Cobertura real (archivos con tests)

- `backend/tests/schemas.test.ts` — loginSchema, gradeSchema, predictSchema, changePassword
- `backend/tests/permissions.test.mjs` — matriz RBAC 3 roles
- `backend/tests/teacher-scope.test.ts` — ámbito profesor
- `backend/tests/estudiante-scope.test.ts` — studentId ajeno
- `backend/tests/prediction-format.test.mjs` — formato tesis español
- `machine-learning/tests/test_predict.py` — heurística, features, predict

## Evidencia terminal

Ver también `../evidencias-finales/terminal/unit-tests-summary.json`
