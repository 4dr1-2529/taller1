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
- Dashboard con totales institucionales (estudiantes, profesores, salones)

## Profesor (`docente`)

- API dedicada: **`GET/POST /profesor/*`**
- Ver y gestionar **solo** cursos asignados (`profesorId` → `seccionId`)
- Registrar notas, asistencia masiva y consultar LMS de **sus** estudiantes
- Predicción y alertas solo en su ámbito (`teacher-scope.ts`, `profesor-query.ts`)
- Filtros: grado, sección, curso, búsqueda por nombre/código
- **No** puede crear estudiantes ni profesores

## Estudiante (`estudiante`)

- API dedicada: **`GET /estudiante/*`** (+ `POST /estudiante/prediccion`)
- Dashboard personal: grado, sección, promedio, asistencia, riesgo, alertas
- **Mis notas** — tabla por curso y bimestre (solo lectura)
- **Mi asistencia** — filtros mes/bimestre/estado/fechas (solo lectura)
- **Mi actividad LMS** — tarjetas, gráficos y tabla semanal
- **Mi riesgo** — score, factores, recomendación, alertas activas
- **Mensajería** — mensajes recibidos (solo lectura en listado dedicado)
- **No** ve otros estudiantes, filtros globales ni reportes institucionales
- **No** envía `studentId` en query/body (403 si intenta acceder a otro perfil)

### Menú frontend (estudiante)

Dashboard · Mis notas · Mi asistencia · Mi actividad LMS · Mi riesgo · Mensajería Académica

## Implementación técnica

| Capa | Archivo |
|------|---------|
| JWT + roles en rutas | `backend/src/middleware/auth.ts` |
| Alcance director/profesor | `backend/src/utils/student-scope.ts`, `teacher-scope.ts` |
| Alcance estudiante | `backend/src/utils/estudiante-scope.ts` |
| Servicio estudiante | `backend/src/services/estudiante.service.ts` |
| Servicio profesor | `backend/src/controllers/profesor.controller.ts` |
| Frontend estudiante | `frontend/src/services/estudianteService.ts`, `components/student/*` |
| Matriz de rutas | `backend/src/routes/index.ts` |

## Respuesta API estándar

```json
{ "success": true, "message": "...", "data": { } }
```

Errores: `{ "success": false, "message": "...", "errors": [] }`
