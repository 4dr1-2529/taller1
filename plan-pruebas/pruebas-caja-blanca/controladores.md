# Pruebas caja blanca — Controladores

Inspección de controladores Express y flujo request → response.

---

## Controladores principales

| Controlador | Responsabilidad |
|-------------|-----------------|
| `auth.controller.ts` | Login, refresh token |
| `students.controller.ts` | CRUD estudiantes |
| `teachers.controller.ts` | CRUD profesores |
| `grades.controller.ts` | Notas bimestrales |
| `predictions.controller.ts` | Predicción + historial |
| `teacher-assignments.controller.ts` | Asignaciones docentes |

---

## Verificaciones

- Validación Zod antes de invocar servicio
- Códigos HTTP correctos (201, 400, 401, 403, 404)
- Sin exposición de password hash en respuestas

---

## Tests

`schemas.test.ts` — validación de payloads por endpoint.
