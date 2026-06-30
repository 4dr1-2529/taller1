# Pruebas caja negra — Cursos

**Vista:** `CoursesView` · **API:** `/courses`, `/academic/cursos-catalogo`

---

## Casos

| ID | Acción | Endpoint | Rol | Evidencia |
|----|--------|----------|-----|-----------|
| TC-CN-05 | Listado cursos | `GET /courses` | auth | `cursos-listado.png` |
| — | Catálogo académico | `GET /academic/cursos-catalogo` | auth | `api.getCursosCatalogo()` |
| — | Crear curso | `POST /courses` | admin, docente | `courseSchema` validación |
| — | Eliminar curso | `DELETE /courses/:id` | **solo admin** routes L150 | RBAC |

---

## Asignaciones curso–profesor–sección

Captura `cursos-asignaciones.png` — relación vía `teacher-assignments` no inscripción curso×alumno (documentado en `ReportsView`).
