# Reglas de negocio Blenkir 2026

## 1. Matrícula (regla crítica)
Un estudiante tiene **exactamente UNA matrícula para el año lectivo 2026**, identificada por
`estudianteId + anioLectivoId` (unique en BD + rechazo en servicio). Aplica aunque la anterior esté
activa, retirada o trasladada. El historial se conserva; jamás se crea una segunda matrícula 2026.
Formulario de alta marca deshabilitados como “Ya matriculado en 2026”; el backend es la autoridad final.

## 2. Registro transaccional
Alta de estudiante (11 pasos: validar, duplicados, sección activa, capacidad, código EST, usuario,
estudiante, matrícula MAT-2026-xxx, inscripciones automáticas, auditoría) con rollback total.
Códigos por tabla `Correlativo` con bloqueo de fila; nunca `count()+1`; nunca se reutilizan.

## 3. Ámbito académico
Toda autorización deriva de Profesor → asignación → curso ofertado → sección → matrícula →
estudiante (año 2026, estados activos). El profesor nunca opera fuera de su ámbito aunque manipule IDs.
El estudiante solo accede a su propio `usuarioId`. El Director administra pero no registra
notas/asistencia/LMS/riesgo manual.

## 4. Notas y asistencia
Notas 0–20 por estudiante/curso/periodo (upsert, únicas). Asistencia por estudiante/fecha con
presente/ausente/tardanza/justificada. Promedio, desaprobados y % asistencia se DERIVAN
(`refreshAcademicSummary`); sin registros se muestra "—", nunca 0 ficticio.

## 5. LMS y vector ML
Solo eventos reales (login/curso/recurso/actividad). Indicadores derivados en ventana de 28 días.
Vector técnico de 7 features (no confundir con variables de investigación de tesis):
promedio_general, cursos_desaprobados, asistencia_general, frecuencia_acceso_lms,
tiempo_interaccion_lms, actividades_realizadas, recursos_consultados.

## 6. Predicción vs alerta
Predicción = resultado persistido del modelo (score, probabilidad, nivel, factores, fecha).
Alerta = gestión posterior (nueva → en seguimiento → resuelta) generada por nivel medio/alto
según umbral configurable, deduplicada. Sin modelo autorizado: 503 controlado, "Sin predicción",
jamás riesgo ficticio.

## 7. Comunicación
Director↔Profesor permitido; Profesor↔Estudiante solo con curso activo compartido 2026 y matrícula
activa; Director↔Estudiante prohibido (403 en backend, incluye rooms forjados). Avisos globales
(Director) y de curso (Profesor) son solo lectura sin respuestas.

## 8. Integridad
Desactivación lógica (estudiantes, profesores, cursos, asignaciones); sin borrados físicos ni
`migrate reset`; auditoría de operaciones críticas; contraseñas bcrypt (8+mayúscula+minúscula+número).
