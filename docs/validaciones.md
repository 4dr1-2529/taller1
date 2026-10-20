# Validaciones

## Backend (Zod — `backend/src/validators/`)

| Campo | Regla |
|-------|--------|
| Promedio | 0–20 |
| Asistencia | 0–100 |
| Email | formato email |
| Contraseña login | mín. 6 |
| Contraseña usuario nuevo | mín. 8, con mayúscula, minúscula y dígito |
| Rol | `admin`, `docente`, `estudiante` |
| DNI | 8 dígitos (opcional) |
| Teléfono | 9 dígitos (opcional) |

## ML (`machine-learning/utils/validators.py`)

- Contrato estricto del V6: exactamente las **7 variables** del contrato 2026 (sin campos extra, sin
  imputación de faltantes); rangos validados para `promedio_general` (≤ 20) y `asistencia_general` (≤ 100).
  *(Este contrato sustituyó al de versiones anteriores, que incluía un campo `estado_estudiante`:
  ya no existe en el pipeline vigente.)*

## Frontend (`frontend/src/lib/validation.ts`)

- Validación en formularios antes de enviar API.
- Mensajes en español vía `toast` y `FormField.error`.

## Reglas de negocio

- Predicción requiere `studentId` existente y en alcance del rol (director/profesor).
- Estudiante: `GET /estudiante/prediccion` — **sin** `studentId` en body/query; ID inferido del JWT.
- `rejectClientStudentId()` — 403 si el cliente envía otro `studentId` en query/body.
- Matrícula: curso debe pertenecer a la sección del estudiante.
- Mensajes globales: solo director.
- Estudiante: solo lectura en notas, asistencia, LMS y alertas.
