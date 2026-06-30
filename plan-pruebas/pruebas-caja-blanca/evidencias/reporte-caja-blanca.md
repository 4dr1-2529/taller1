# Auditoría caja blanca

**Fecha:** 2026-06-30T07:23:31.499Z

**Archivos analizados:** 41
**Validaciones documentadas:** 9
**Ramas evaluadas:** 5

## Archivos por categoría

| Categoría | Archivo | Cubierto test |
|-----------|---------|---------------|
| servicios | backend/src/services/dashboard-analytics.service.ts | Parcial |
| servicios | backend/src/services/estudiante.service.ts | Parcial |
| servicios | backend/src/services/ml-client.ts | Parcial |
| servicios | backend/src/services/profesor-dashboard.service.ts | Parcial |
| servicios | backend/src/services/recommendations.ts | Parcial |
| servicios | backend/src/services/risk-engine.ts | Parcial |
| servicios | backend/src/services/teacher-assignment.service.ts | Parcial |
| controladores | backend/src/controllers/academic-structure.controller.ts | Parcial |
| controladores | backend/src/controllers/accounts-export.controller.ts | Parcial |
| controladores | backend/src/controllers/admin.controller.ts | Parcial |
| controladores | backend/src/controllers/alerts.controller.ts | Parcial |
| controladores | backend/src/controllers/attendance.controller.ts | Parcial |
| controladores | backend/src/controllers/auth.controller.ts | Parcial |
| controladores | backend/src/controllers/courses.controller.ts | Parcial |
| controladores | backend/src/controllers/estudiante.controller.ts | Parcial |
| controladores | backend/src/controllers/grades.controller.ts | Parcial |
| controladores | backend/src/controllers/matriculas.controller.ts | Parcial |
| controladores | backend/src/controllers/messages.controller.ts | Parcial |
| controladores | backend/src/controllers/predict.controller.ts | Parcial |
| controladores | backend/src/controllers/predictions.controller.ts | Parcial |
| controladores | backend/src/controllers/profesor.controller.ts | Parcial |
| controladores | backend/src/controllers/reports.controller.ts | Parcial |
| controladores | backend/src/controllers/students.controller.ts | Parcial |
| controladores | backend/src/controllers/teacher-assignments.controller.ts | Parcial |
| controladores | backend/src/controllers/teachers.controller.ts | Parcial |
| middlewares | backend/src/middleware/auth.ts | Parcial |
| middlewares | backend/src/middleware/errorHandler.ts | Sí |
| middlewares | backend/src/middleware/sanitize.ts | Parcial |
| rutas | backend/src/routes/index.ts | Parcial |
| prisma | backend/prisma/schema.prisma | Sí |
| ia | machine-learning/app/features.py | Parcial |
| ia | machine-learning/app/main.py | Parcial |
| ia | machine-learning/app/__init__.py | Parcial |
| ia | machine-learning/evaluate.py | Parcial |
| ia | machine-learning/tests/test_predict.py | Parcial |
| ia | machine-learning/train.py | Parcial |
| ia | machine-learning/utils/validators.py | Sí |
| frontend_critico | frontend/src/app/(shell)/page.tsx | Parcial |
| frontend_critico | frontend/src/app/(auth)/login/page.tsx | Parcial |
| frontend_critico | frontend/src/components/views/PredictionView.tsx | Parcial |

## Ramas evaluadas

- **authenticate sin token → 401** — `backend/src/middleware/auth.ts` — evidencia: smoke + run-api-tests
- **authorize admin only → 403 docente** — `backend/src/routes/index.ts L100` — evidencia: run-api-tests TC-SEC-03
- **estudiante scope studentId ajeno** — `backend/src/utils/estudiante-scope.ts` — evidencia: estudiante-scope.test.ts
- **heurística riesgo bajo/alto** — `machine-learning/app/predict.py` — evidencia: test_predict.py
- **ROLE_SECTIONS por rol** — `frontend/src/app/(shell)/page.tsx` — evidencia: capture-ui 3 roles