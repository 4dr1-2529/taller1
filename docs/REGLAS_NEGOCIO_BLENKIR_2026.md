# Reglas de negocio Blenkir 2026

> Fase 4 — verificadas contra código real (backend, Prisma, scopes, tests). La autoridad es el
> comportamiento del sistema; donde el código contradecía la regla institucional, se corrigió el código.

## 1. Matrícula (regla crítica)
Un estudiante tiene **exactamente UNA matrícula para el año lectivo 2026**, identificada por
`estudianteId + anioLectivoId` (unique en BD + rechazo 409 en `student-registration.service.ts`).
Aplica aunque la anterior esté activa, retirada o trasladada. El historial se conserva; jamás se crea
una segunda matrícula 2026. Formulario de alta marca deshabilitados como “Ya matriculado en 2026”;
el backend es la autoridad final. Verificado: `enroll2026` + tests de duplicado tras retiro/traslado.

## 2. Registro transaccional
Alta de estudiante (11 pasos: validar, duplicados, sección activa, capacidad, código EST, usuario,
estudiante, matrícula MAT-2026-xxx, inscripciones automáticas, auditoría) con rollback total.
Códigos por tabla `Correlativo` con bloqueo de fila; nunca `count()+1`; nunca se reutilizan.

## 3. Ámbito académico
Toda autorización deriva de Profesor → asignación → curso ofertado → sección → matrícula →
estudiante (año 2026, estados activos). El profesor nunca opera fuera de su ámbito aunque manipule IDs.
El estudiante solo accede a su propio `usuarioId`. El Director administra pero no registra
notas/asistencia/LMS/riesgo manual.

## 4. Estados del estudiante (no confundir)
- `Student.activo` (boolean): perfil/cuenta administrativa habilitada. `false` bloquea auth
  (`authenticate` exige `User.activo`), excluye de scopes activos, revoca sesiones al desactivar.
- `Student.estado` (`activo | retirado`): estado académico/institucional. `updateStudent` lo edita;
  no desactiva la cuenta por sí solo.
- `Matricula.estado` (`activa | retirada | trasladada`): estado de la matrícula 2026. Retiro/traslado
  cambian este campo y retiran `Enrollment` del año, conservando notas/asistencia/historial.
- `Enrollment.estado` (`activa | retirada`): inscripción en una oferta de curso concreta.
- RETIRAR MATRÍCULA ≠ DESACTIVAR CUENTA: el retiro conserva el perfil activo con historial; la
  desactivación (`DELETE /students/:id`) pone `Student.activo=false` + `User.activo=false` +
  `Session.revocada=true`, preservando toda evidencia histórica.

## 5. Retiro de matrícula
Flujo oficial: matrícula activa → `PATCH /matriculas/:id {retirada}` → conserva registro →
retira inscripciones del año → conserva notas/asistencia/historial/predicciones/auditoría →
pierde scopes que exigen matrícula activa (verificado en tests: profesor 403, mensajería sin sala).
Nunca se borra nada; nunca se crea segunda matrícula.

## 6. Traslado (alcance real)
`trasladada` = **traslado externo / salida de la institución durante 2026**: mismo registro,
`Enrollment` retirada, historial intacto, sin destino, sin cambio de sección, sin segunda matrícula.
No existe traslado interno entre secciones (sin evidencia documental ni campos de destino); no se
implementó transferencia para no inventar requisitos. Si aparece requisito explícito, se reporta antes
de cualquier cambio estructural.

## 7. Desactivación de estudiante
`DELETE /students/:id` (admin): `Student.activo=false`, `User.activo=false`, sesiones revocadas,
excluido de scopes activos, historial intacto. Diferencia con retiro documentada en §4–§5.

## 8. Profesores: sin bypass por PUT
`DELETE /teachers/:id` y `PUT /teachers/:id {activo:false}` aplican la MISMA regla: con asignaciones
activas → 409 “Desactive las asignaciones primero” (validación dentro de la transacción; test:
PUT con carga → 409, sin carga → 200). `assertTeacherActive` bloquea asignar docentes inactivos.

## 9. Asignación docente (fuente de verdad)
`TeacherCourseAssignment` + `syncCourseOffering()` son la autoridad; `Course.profesorId` es un reflejo
sincronizado, nunca edición directa. 1°–2°: tutor de aula (`esTutor`, un tutor por sección);
3°–6°: polidocencia (máx. `MAX_POLIDOCENCIA_COURSES` cursos y `MAX_POLIDOCENCIA_SECTIONS` salones).
`assertTeacherAssignmentAccess` exige asignación activa para operar el curso.

## 10. Reasignación (único flujo)
`POST /courses/:id/reassign {profesorId}` (admin): actualiza la fila única de asignación del
mismo curso/sección/año (`uk_asig_cur_sec_anio` impide duplicados, incluso inactivos), crea la del
nuevo docente solo si no existe, sincroniza `Course.profesorId`, preserva `Enrollment` y notas,
audita `REASSIGN` con docente anterior y nuevo. Tests: anterior → 403 en
notas del curso, nuevo → 200, inscripción y nota histórica intactas. `PUT /courses/:id` rechaza
`profesorId` (400) y `seccionId` (400); `activo:false` con notas → 409 igual que DELETE.

## 11. Desactivación de curso/asignación/profesor
Desactivar afecta acceso futuro, nunca destruye evidencia: curso con notas no se desactiva
(409); desactivar asignación con notas conserva la oferta activa (`deactivateCourseOfferingIfEmpty`);
desactivar profesor desactiva sus ofertas sin notas y su cuenta. Notas, matrículas, estudiantes
y auditoría jamás se borran.

## 12. Notas
0–20, upsert único por estudiante+curso+período 2026, con profesor asignado + estudiante
matriculado/inscrito verificados (`assertTeacherCourseAccess`, `assertStudentInCourseSection`).
Toda escritura refresca `refreshAcademicSummary` en la misma transacción + auditoría. Director solo
consulta; estudiante solo lo propio.

## 13. Promedio (fórmula exacta)
Promedio por curso = media de sus notas 2026; promedio general = media de promedios por curso
(`lms.service.ts` y `academic-records.service.ts`). Sin notas → `null` funcional (“Sin datos”/“—”
en UI y reportes); el `0` persistido en `Student.promedioGeneral` es default técnico, nunca nota real.

## 14. Asistencia (fórmula exacta)
Estados: presente / ausente / tardanza / justificada. Computable = no justificados;
`asistencia_general = 100 × (presente OR tardanza) / computables`, o `null` sin registros
(“Sin datos”, nunca 0 ficticio). Rango limitado a 2026; día exacto normalizado a UTC.

## 15. LMS (solo eventos observados)
Ventana 28 días. 7 features: promedio_general, cursos_desaprobados, asistencia_general,
frecuencia_acceso_lms (logins/4), tiempo_interaccion_lms (horas, idle >5min excluido),
actividades_realizadas (completadas en cursos 2026), recursos_consultados (distintos).
Sin tareas_ratio/participación/foros/disminución/estado/novena variable. Indicadores derivados, sin
edición manual.

## 16. Predicción
Flujo: indicadores → `buildMlPayload` → FastAPI → `Prediction` (score, nivel, probabilidad, factores,
recomendación) → alerta si corresponde. Sin notas/asistencia suficientes → 409; sin modelo → 503
“sin riesgo ficticio”. Nunca fallback, score ni métricas inventadas.

## 17. Alertas (umbral y deduplicación exactos)
Umbral `alertas.nivel_minimo`: `medio` → genera medio+alto; `alto` → solo alto (`persistPrediction`:
`level === "alto" || level === threshold`). Dedup clave = **estudiante + nivel + alerta abierta**
(`nueva` o `en_seguimiento`); no es “una por estudiante”. Ciclo nueva → en_seguimiento → resuelta
con historial (`alertaHistorial`); predecir de nuevo no duplica.

## 18. Mensajería (VERIFICADO / HEREDADO DE HARDENING PREVIO)
`messages.controller.ts` no se modificó en `e04887f` (verificado por `git show`). Reglas vigentes:
Director↔Profesor permitido; Profesor↔Estudiante solo con profesor/curso 2026 activos + `Enrollment`
activa + matrícula activa + estudiante activo; Director↔Estudiante 403 (incluye rooms forjados);
retirado pierde salas derivadas de matrícula activa. Avisos solo lectura.

## 19. Integridad transaccional
Matrícula, retiro/traslado, reasignación, desactivaciones con dependencias, notas+resumen,
asistencia+resumen y Prediction+Alert corren en transacciones Prisma con bloqueos (`FOR UPDATE`)
y auditoría; sin estados parciales.
