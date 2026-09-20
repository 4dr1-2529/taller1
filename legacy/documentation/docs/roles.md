# Roles y permisos

Solo **3 roles** en el sistema:

| Código | UI | Descripción |
|--------|-----|-------------|
| `admin` | Director | Gestión institucional completa |
| `docente` | Profesor | Solo sus cursos y estudiantes de sus secciones |
| `estudiante` | Estudiante | Solo su información (endpoints `/estudiante/*`) |

## Matriz resumida

| Acción | Director | Profesor | Estudiante |
|--------|----------|----------|------------|
| CRUD profesores | ✅ | ❌ | ❌ |
| CRUD estudiantes | ✅ | ❌ | ❌ |
| CRUD cursos / matrículas | ✅ | ❌ / ❌ | ❌ |
| Notas / asistencia / LMS | ✅ global | ✅ (propios alumnos) | 👁️ solo propio |
| Predicción | ✅ | ✅ (propios) | 👁️ + POST propio |
| Alertas | ✅ todas | ✅ propias | 👁️ activas |
| Comunicados globales | ✅ enviar | ❌ | 👁️ recibir |
| Mensajes directos | ✅ | ✅ | 👁️ / responder |
| Reportes globales | ✅ | ❌ | ❌ |
| Filtros grado/sección | ✅ | ✅ (sus salones) | ❌ |

## Estudiante — reglas clave

- Frontend: `estudianteService` → solo `/api/estudiante/*`
- Backend: `requireStudentIdFromUser()` + `rejectClientStudentId()`
- No edita notas, asistencia, LMS ni estado de alertas
- No accede a `/students`, `/profesor/*`, `/dashboard/kpis`

## Implementación

| Capa | Archivo |
|------|---------|
| JWT + roles | `backend/src/middleware/auth.ts` |
| Alcance director/profesor | `backend/src/utils/student-scope.ts`, `teacher-scope.ts` |
| Alcance estudiante | `backend/src/utils/estudiante-scope.ts` |
| Servicios por rol | `estudiante.service.ts`, `profesor-dashboard.service.ts` |
| Rutas | `backend/src/routes/index.ts` |

Detalle ampliado: [roles-permisos.md](./roles-permisos.md) · Endpoints: [API.md](./API.md)
