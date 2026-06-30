# Pruebas caja negra — Configuración

Módulos de administración y estructura académica (solo Director / admin).

---

## Secciones UI (`ROLE_SECTIONS.admin` exclusivas)

| Sección | Componente | API principal |
|---------|------------|---------------|
| Asignaciones | `TeacherAssignmentsView` | `/teacher-assignments`, `/teacher-assignments/tutor` |
| Matrículas | `EnrollmentsView` | `POST /matriculas`, `GET /matriculas/stats` |
| Profesores | `TeachersView` | CRUD `/teachers` |
| — Admin usuarios | (futuro panel) | `/admin/users` CRUD |

---

## Casos

| ID | Acción | Entrada | Resultado | Evidencia |
|----|--------|---------|-----------|-----------|
| TC-CN-10 | Asignar tutor | `POST /teacher-assignments/tutor` | Tutor por sección | `asignaciones-docentes.png` |
| TC-SEC-06 | Crear usuario rol inválido | `createUserSchema role: tutor` | Zod fail | `schemas.test.ts` |
| TC-BE-08 | Export cuentas | `GET /admin/cuentas-acceso` | JSON accesos demo | `cuentas-demo/` |
| — | Crear sección | `POST /academic/secciones` admin | 201 | `createSeccion` controller |
| — | Años lectivos | `GET /academic/anios-lectivos` | Lista para matrícula | `api.getAniosLectivos()` |

---

## Restricción rol

Docente y estudiante **no** ven: Asignaciones, Matrículas, Profesores, Reportes (`ROLE_SECTIONS` comparación TC-FE-04 vs TC-FE-03).
