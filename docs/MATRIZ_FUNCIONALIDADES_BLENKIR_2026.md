# Matriz de funcionalidades Blenkir 2026

Leyenda de estado: COMPLETO · FUNCIONA CON OBSERVACIONES · INCOMPLETO · BLOQUEADO POR ML.
Todo lo listado está verificado en código y cubierto por suites verdes salvo indicación.

| Módulo | Funcionalidad | Director | Profesor | Estudiante | Frontend | Backend | BD | Estado |
|---|---|---|---|---|---|---|---|---|
| Auth | login/logout/refresh/sesiones | sí | sí | sí | LoginView/AuthProvider | auth.controller + Session | Session/IntentoLogin | COMPLETO |
| Auth | cambio de contraseña (8+may+min+num) | sí | sí | sí | SettingsView | auth.controller + schemas | User | COMPLETO |
| Estructura | niveles/grados/secciones/año/periodos |CRUD lectura| lectura propia | — | AcademicStructureView | academic-structure.controller | Nivel/Grado/Seccion/Anio/Periodo | COMPLETO |
| Estudiantes | registro transaccional + código EST | sí | no | no | StudentsView | students.controller + registration service | Student/User/Matricula/Enrollment | COMPLETO |
| Estudiantes | edición/desactivación | sí | no | no | StudentsView modal | update/deactivate + audit | estado/activo | COMPLETO |
| Profesores | registro + PROF + cuenta | sí | no | no | TeachersView | teachers.controller + registration service | Teacher/User | COMPLETO |
| Profesores | asignaciones por curso/grado/sección/2026 | sí | consulta propia | no | TeacherAssignmentsView | teacher-assignments.controller | TeacherCourseAssignment | COMPLETO |
| Matrícula | alta + MAT-2026 + inscripciones auto | sí | no | no | EnrollmentsView | matriculas.controller + enroll2026 | Matricula/Enrollment unique | COMPLETO |
| Matrícula | retiro/traslado sin borrado | sí | no | no | acciones Retirar/Trasladar | updateMatriculaState | estado + historial | COMPLETO |
| Cursos | catálogo/oferta/reasignar/desactivar | sí | consulta propios | consulta propios | CoursesView/LearningView | courses.controller | CursoCatalogo/CursoGrado/Course | COMPLETO |
| Notas | registro 0–20 por curso/periodo | consulta | propios | propias | ProfessorGradesView/GradesView/StudentGradesView | grades.controller + scope curso | Grade unique | COMPLETO |
| Asistencia | presente/ausente/tardanza/justificada | consulta | propio ámbito | propia | ProfessorAttendanceView/AttendanceView/StudentAttendanceView | attendance.controller | Attendance unique | COMPLETO |
| Materiales | 6 tipos por curso + evento lectura | consulta | publica propios | consulta matriculados | LearningView | lms.controller | CourseResource/LmsEvent | COMPLETO |
| Actividades | 5 tipos + progreso pen/ini/com | consulta | publica propias | ejecuta propias | LearningView | lms.controller | AcademicActivity/ActivityProgress | COMPLETO |
| LMS | eventos + indicadores 28 días | consulta | consulta | propio | ObservedProgressView/LearningView | lms.service | LmsEvent | COMPLETO |
| ML | vector 7 vars + FastAPI /predict /metrics | n/a | n/a | n/a | MlMetricsSection (estado) | ml-client + main.py/features/validators | MlFeatureDef/Dataset/Modelo | BLOQUEADO POR ML (código listo, sin artefacto) |
| Predicción | persistencia + factores + historial | consulta/ejecuta | ejecuta ámbito | solo lectura | PredictionView/ProfessorPredictionView/StudentPredictionView | predict.controller + persistence service | Prediction/FeatureSnapshot/Factor | COMPLETO (requiere ML) |
| Alertas | nueva/seguimiento/resuelta + filtros | gestiona | gestiona ámbito | solo lectura | AlertsView/ProfessorAlertsView | alerts.controller | Alert/Historial/Factor | COMPLETO |
| Mensajes | Director↔Profesor, Profesor↔Alumno vinculado | profesores | director+alumnos | profesores | MensajeriaAcademicaView | messages.controller + policy | MensajeSala/ChatMessage/Read | COMPLETO |
| Avisos | global y curso, solo lectura | publica global | publica curso | lee | modo announcements | publishAnnouncement | salas alcance | COMPLETO |
| Reportes | excel/pdf + dashboard KPIs | sí | alcance | no | ReportsView/RoleDashboard/Bento | reports.controller + analytics | Report/Snapshot | COMPLETO |
| Auditoría | quién/qué/cuándo/entidad/IP | sí | no | no | AuditView | admin.controller + AuditLog | AuditLog | COMPLETO |
| Configuración | institucional + contraseña | ambas | contraseña | contraseña | SettingsView | settings.controller | SystemConfig | COMPLETO |
