# Roles y permisos

Solo **3 roles** en el sistema:

| Código | UI | Descripción |
|--------|-----|-------------|
| `admin` | Director | Gestión institucional completa |
| `docente` | Profesor | Solo sus cursos y estudiantes matriculados |
| `estudiante` | Estudiante | Solo su información |

## Matriz resumida

| Acción | Director | Profesor | Estudiante |
|--------|----------|----------|------------|
| CRUD profesores | ✅ | ❌ | ❌ |
| CRUD estudiantes | ✅ | ❌ | ❌ |
| CRUD cursos / matrículas | ✅ | ❌ / ❌ | ❌ |
| Notas / asistencia / LMS | ✅ | ✅ (propios) | 👁️ |
| Predicción | ✅ | ✅ (propios) | 👁️ riesgo |
| Alertas | ✅ todas | ✅ propias | ❌ |
| Comunicados globales | ✅ | ❌ | 👁️ |
| Mensajes a estudiantes | ✅ | ✅ | responder |

Implementación: `backend/src/utils/student-scope.ts` + `authorize()` en rutas.
