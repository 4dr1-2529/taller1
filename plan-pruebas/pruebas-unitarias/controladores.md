# Pruebas unitarias — Controladores

Análisis caja blanca de `backend/src/controllers/` vs rutas en `routes/index.ts`.

---

## Controladores y endpoints cubiertos

| Controlador | Rutas | Rol mínimo | Validación Zod |
|-------------|-------|------------|----------------|
| `auth.controller.ts` | `/auth/login`, `/refresh`, `/me`, `/change-password` | Público / auth | `loginSchema`, `changePasswordSchema` |
| `students.controller.ts` | `/students` CRUD | admin (write), admin+docente (read) | `studentSchema` |
| `teachers.controller.ts` | `/teachers` CRUD, `/detail` | admin (write/detail) | `teacherSchema` |
| `teacher-assignments.controller.ts` | `/teacher-assignments/*` | admin | asignación tutor/polidocencia |
| `courses.controller.ts` | `/courses` CRUD | admin+docente (create), admin (delete) | `courseSchema` |
| `grades.controller.ts` | `/grades` | admin+docente | `gradeSchema` nota 0–20 |
| `predict.controller.ts` | `/predict`, `/dashboard/kpis` | auth / admin+docente | `predictSchema` |
| `predictions.controller.ts` | `/predictions` | admin+docente | — |
| `alerts.controller.ts` | `/alerts`, PATCH estado | admin+docente | `alertStatusSchema` |
| `profesor.controller.ts` | `/profesor/*` (12 rutas) | docente | scope por cursos |
| `estudiante.controller.ts` | `/estudiante/*` (8 rutas) | estudiante | `rejectClientStudentId` |
| `reports.controller.ts` | `/reports`, snapshots, risks | mixto | — |
| `admin.controller.ts` | `/admin/users`, audit, stats | admin | `createUserSchema` |

---

## Ramas críticas a probar manualmente

| Controlador | Rama | Condición | Caso matriz |
|-------------|------|-----------|-------------|
| `predict.controller.ts` | ML remoto vs local | `ML_SERVICE_URL` definido | TC-INT-06 |
| `students.controller.ts` | Paginación | `?page=&limit=` | TC-PERF-03 |
| `grades.controller.ts` | Nota inválida | Zod reject | TC-CB-01 |
| `alerts.controller.ts` | PATCH estado inválido | `cerrada` → 400 | TC-CB-03 |

---

## Tests automatizados relacionados

- `schemas.test.ts` — payloads de entrada por controlador
- `estudiante-scope.test.ts` — `estudiante.controller` seguridad
- `teacher-scope.test.ts` — filtro `profesor.controller` estudiantes
