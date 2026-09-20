# API Blenkir 2026-v2

Base: /api/v1. JWT Bearer, respuestas {success,message,data} y errores con estado HTTP. Identificadores BigInt se transmiten como strings. La validación backend es definitiva.

| Método/ruta | Uso y alcance |
|---|---|
| POST /auth/login, /auth/refresh, /auth/logout, /auth/change-password | Autenticación, sesión, cambio de contraseña |
| GET /students, /students/:id | Datos dentro del scope; estudiante solo propio |
| POST /students | Director; dni,nombres,apellidos,seccionId,correo?,telefono?; alta transaccional |
| PATCH /students/:id | Director; datos personales validados |
| DELETE /students/:id | Director; desactivación lógica |
| POST /teachers | Director; DNI, nombres, especialidad, correo, teléfono y cuenta opcional; código automático |
| POST /matriculas | Director; matrícula activa de 2026, código automático |
| PATCH /matriculas/:id | Director; retirada/trasladada; retira inscripciones preservando historial |
| GET/POST /grades | Director consulta; profesor registra en curso asignado |
| GET/POST /attendance | Director consulta; profesor registra dentro del alcance |
| GET /learning?courseId=ID | Materiales y actividades autorizados |
| POST /materials, /activities | Profesor asignado publica |
| GET /materials/:id | Consulta autorizada y evento de recurso |
| PATCH /activities/:id/progress | Estudiante: iniciada/completada; iniciar antes de completar |
| POST /lms/course-access | Estudiante registra acceso a curso autorizado |
| GET /students/:id/indicators | Indicadores derivados, dentro del scope |
| POST /predict | Director/profesor; solo studentId; 409 sin datos, 503 sin modelo |
| GET /predictions | Historial dentro del scope |
| GET /messages/rooms, /messages/:roomId | Conversaciones directas autorizadas |
| POST /messages | Solo directo; contenido, destinatario y/o sala; matriz de roles |
| GET /announcements/rooms, /announcements/:roomId | Avisos de lectura |
| POST /announcements | Director global; profesor curso; no parentMessageId |
| PATCH /announcements/:roomId/read | Guarda lectura individual |
| GET /admin/audit-logs | Auditoría del Director, paginada |
| GET/PUT /admin/settings | Año fijo y umbral medio/alto de alertas |

Consultar routes/index.ts para las rutas académicas y de reportes preexistentes conservadas. No enviar códigos, notas derivadas, actividad LMS o riesgo en el alta. Las pruebas de integración ejecutan la matriz real de autorización.
