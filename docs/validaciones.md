# Validaciones

## Backend (Zod — `backend/src/validators/`)

| Campo | Regla |
|-------|--------|
| Promedio | 0–20 |
| Asistencia | 0–100 |
| Email | formato email |
| Contraseña login | mín. 6 |
| Contraseña usuario nuevo | mín. 8 |
| Rol | `admin`, `docente`, `estudiante` |
| DNI | 8 dígitos (opcional) |
| Teléfono | 9 dígitos (opcional) |

## ML (`machine-learning/utils/validators.py`)

- Rangos numéricos por variable tesis.
- `estado_estudiante`: activo, en_riesgo, retirado.

## Frontend (`frontend/src/lib/validation.ts`)

- Validación en formularios antes de enviar API.
- Mensajes en español vía `toast` y `FormField.error`.

## Reglas de negocio

- Predicción requiere `studentId` existente y en alcance del rol (director/profesor).
- Estudiante: `POST /estudiante/prediccion` — **sin** `studentId` en body; ID inferido del JWT.
- `rejectClientStudentId()` — 403 si el cliente envía otro `studentId` en query/body.
- Matrícula: curso debe pertenecer a la sección del estudiante.
- Mensajes globales: solo director.
- Estudiante: solo lectura en notas, asistencia, LMS y alertas.
