# Arquitectura Blenkir 2026-v2

> **DOCUMENTO CANÓNICO DE ARQUITECTURA.** Su contenido prevalece sobre las variantes de
> `docs/arquitectura/*.md`; si algo difiere, vale este archivo. Estado operativo verificado
> (fechas, URLs, recuentos y modelo ML): [ESTADO_ACTUAL_V6.md](ESTADO_ACTUAL_V6.md).

Año lectivo único operativo: **2026**. Next.js/TypeScript en Vercel → Express/TypeScript en Railway → Prisma/MySQL y FastAPI/Python.

Se conservan JWT, refresh tokens, bcrypt, sesiones, Helmet, CORS, límites de peticiones, sanitización y scopes. Las bajas normales son lógicas. No hay poblaciones demo automáticas durante despliegues.

## Registro y matrícula

student-registration.service.ts coordina una transacción única: validaciones y duplicados, correlativo, usuario, estudiante, matrícula 2026, inscripción en ofertas existentes y auditoría. La sección se bloquea antes de comprobar capacidad. Si aún no tiene ofertas, las asignaciones posteriores sincronizan inscripciones. Un fallo revierte toda la operación. La restricción estudiante/año impide duplicados.

correlativo.service.ts bloquea la fila persistente por entidad y considera el máximo código histórico, incluidos inactivos: EST-XXX, PROF-XXX y MAT-2026-XXX. Nunca usa count()+1. Las credenciales temporales se entregan una sola vez; solo persiste el hash bcrypt.

Profesor se registra sin cursos; las asignaciones vinculan profesor, catálogo de curso, grado/sección y 2026. Materiales, actividades y eventos tienen relaciones e índices propios; mensajes y avisos reutilizan las salas existentes.

## Indicadores

Promedio: media de promedios de cursos con notas 2026; desaprobados: cursos con promedio menor que 11. Asistencia: 100 × (presentes + tardanzas) / registros no justificados. Sin observaciones académicas suficientes no se genera predicción (409).

LMS usa una ventana móvil de 28 días dentro del año lectivo: frecuencia = logins/4 semanas; tiempo = segundos observados entre eventos consecutivos separados por hasta cinco minutos, convertido a horas; actividades = completadas en ventana; recursos = materiales distintos consultados. Se informa días activos y último evento. El tiempo es una estimación de interacción observada, no tiempo total de conexión ni una medición de atención. No se incluye disminución de actividad sin validación longitudinal.

Vector ML ordenado: promedio_general, cursos_desaprobados, asistencia_general, frecuencia_acceso_lms, tiempo_interaccion_lms, actividades_realizadas, recursos_consultados. Sin valores LMS manuales, foros, ratios de tareas ni novena variable artificial. Los modelos anteriores se archivan y no se cargan. Sin modelo compatible se responde 503, sin fallback de riesgo inventado.

Predicciones conservan modelo, versión de contrato, entradas, factores, probabilidad, recomendación y fecha. Alertas automáticas desde medio/alto configurable, con historial de cambios. Los factores descriptivos son reglas explicativas de indicadores, no atribuciones SHAP ni evidencia causal.

## Permisos

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

