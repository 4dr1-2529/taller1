# Pruebas caja negra — Profesores

**Vista:** `TeachersView` · **API:** `/teachers`, `/teacher-assignments`

---

## Casos

| ID | Acción | Código / resultado | Evidencia |
|----|--------|-------------------|-----------|
| TC-CN-04 | Listar plantilla | `GET /teachers` — 23 activos seed | `profesores-listado.png` |
| TC-BE-12 | Detalle docente | `GET /teachers/:id/detail` solo `authorize("admin")` | `profesor-detalle.png` |
| TC-CN-10 | Asignaciones | `TeacherAssignmentsView` + `GET /teacher-assignments` | `asignaciones-docentes.png` |
| TC-ROL-03 | Docente crea profesor | `POST /teachers` → 403 | `permissions.test.mjs` |

---

## Formulario (`defaultTeacherForm`)

Validado por `teacherSchema`: `codigo`, `nombres`, `apellidos`, `especialidad`, `correo` email válido (`schemas.test.ts`).

---

## Carga académica

`GET /teacher-assignments` filtra por `profesorId`, `gradoId`, `seccionId` — captura `carga-academica-asignaciones.png`.
