# Roles y permisos

Solo **3 roles** (sin roles adicionales):

| Código API | Etiqueta UI | Descripción |
|------------|-------------|-------------|
| `admin` | **Director** | Acceso total institucional |
| `docente` | **Profesor** | Solo sus cursos y estudiantes |
| `estudiante` | **Estudiante** | Solo su propia información |

## Director (`admin`)

- CRUD estudiantes, profesores, cursos, matrículas, usuarios admin
- Predicción y alertas de toda la institución
- Comunicados globales y reportes
- Eliminar registros de asistencia

## Profesor (`docente`)

- Ver y gestionar **solo** cursos asignados (`profesorId`)
- Registrar notas, asistencia y actividad LMS de **sus** estudiantes
- Predicción y alertas solo en su ámbito (`student-scope.ts`)
- **No** puede crear estudiantes ni profesores

## Estudiante (`estudiante`)

- Ver notas, asistencia, LMS y riesgo **propio**
- Historial de predicciones propio
- Mensajería académica (responder)
- **No** registra notas ni ve datos de otros

## Implementación técnica

| Capa | Archivo |
|------|---------|
| JWT + roles en rutas | `backend/src/middleware/auth.ts` |
| Alcance de datos | `backend/src/utils/student-scope.ts` |
| Curso del profesor | `backend/src/utils/course-authorization.ts` |
| Matriz de rutas | `backend/src/routes/index.ts` |

## Respuesta API estándar

Todas las rutas devuelven:

```json
{ "success": true, "message": "...", "data": { } }
```

Errores: `{ "success": false, "message": "...", "errors": [] }`
