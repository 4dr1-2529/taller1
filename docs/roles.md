# Roles y permisos 2026

| Operación | Director (admin) | Profesor (docente) | Estudiante |
|---|---|---|---|
| Estudiantes, profesores, matrícula y asignaciones | Administra | Consulta alcance | Propio |
| Notas y asistencia | Consulta | Registra en alcance | Consulta propias |
| Materiales y actividades | Supervisa | Publica en sus cursos | Consulta/realiza en matrícula |
| Predicciones | Genera/consulta global | Genera/consulta alcance | Consulta propia |
| Alertas internas | Consulta/gestiona | Gestiona alcance | No administra |
| Mensaje Director ↔ Profesor | Permitido | Permitido | No aplica |
| Mensaje Profesor ↔ Estudiante | No aplica | Solo asociados | Solo asociados |
| Mensaje Director ↔ Estudiante | Prohibido (403) | No aplica | Prohibido (403) |
| Avisos globales | Publica | Lee | Lee |
| Avisos de curso | Consulta | Publica en alcance | Lee |

Los avisos no aceptan respuestas; se registra lectura por usuario y fecha. La autorización se verifica en backend, incluidos los identificadores de conversación suministrados por el cliente.
