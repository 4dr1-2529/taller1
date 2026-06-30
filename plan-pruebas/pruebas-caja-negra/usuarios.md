# Pruebas caja negra — Usuarios (Estudiantes)

**Vista:** `StudentsView` · **API:** `GET/POST/PUT/DELETE /students`

---

## Casos basados en código

| ID | Rol | Acción UI/API | Resultado esperado | Evidencia |
|----|-----|---------------|-------------------|-----------|
| TC-CN-03 | admin | `StudentsView` listado paginado | 660 estudiantes, búsqueda `api.getStudents(page,limit,q)` | `estudiantes-listado-director.png` |
| TC-BE-05 | admin | `POST /students` body `studentSchema` | 201 Created | Postman / manual |
| TC-SEC-04 | estudiante | `GET /students` | 403 — `authorize("admin","docente")` routes L99 | `roles-estudiante.test.mjs` |
| TC-CN-03b | admin | Click fila → detalle | Ficha con métricas LMS | `estudiante-detalle.png` |

---

## Formulario creación (`defaultStudentForm`)

Campos validados por `studentSchema`: `codigo`, `nombres`, `apellidos`, `seccionId` obligatorios (`schemas.test.ts`).

---

## API frontend (`api.ts`)

```typescript
getStudents(page, limit, q)  // GET /students?page=&limit=&q=
deleteStudent(id)             // DELETE /students/:id — solo admin
```
