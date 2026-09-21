# Auditoría de flujos end-to-end Blenkir 2026 (Fases 5–10)

Rama `audit/full-functional-review` · base `101d68a`. Método: lectura directa de código +
suites de integración (30 subtests) sobre BD aislada. Sin Data Seed, sin ML entrenado, sin rediseño visual.

## Fase 5 — Autenticación, sesión y cuentas

| Flujo | Rol | Precondición | Acción → endpoint | Persistencia | Resultado | Test | Estado |
|---|---|---|---|---|---|---|---|
| Login director | admin | usuario activo | POST /auth/login | Session CREATE + AuditLog LOGIN + LmsEvent login | JWT + refresh 7d + user | auth flow | ✅ |
| Login profesor/estudiante | docente/estudiante | cuenta vinculada activa | POST /auth/login | idem | dashboard por rol | auth flow | ✅ |
| Credencial incorrecta | — | — | POST /auth/login | intento contado por IP (5 → 429/15min) | 401 genérico, sin enumerar | auth flow | ✅ |
| Usuario inactivo | — | activo=false | POST /auth/login, /auth/refresh | — | 401 | auth flow | ✅ |
| Profesor/estudiante desactivado | — | Teacher/Student+User inactivos | POST /auth/login | — | 401 (User.activo manda) | código | ✅ |
| Refresh válido | auth | sesión vigente | POST /auth/refresh | — | nuevo access token | auth flow | ✅ |
| Logout | auth | sesión vigente | POST /auth/logout (+refreshToken) | Session revocada=true + LOGOUT + LmsEvent logout | refresh posterior → 401 | auth flow | ✅ |
| Sin token / rol incorrecto | — | — | cualquier ruta | — | 401 / 403 | matrix | ✅ |
| Cambio de clave | auth | actual correcta | POST /auth/change-password | passwordHash bcrypt(12) + CHANGE_PASSWORD | débil → 400, ok → login con nueva | auth flow | ✅ |
| Cuenta docente | admin | profesor sin cuenta | POST /teachers/:id/account (contraseña director, regla 8+may+min+num) | User CREATE vinculado | profesor se autentica | integración | ✅ |
| Cuenta estudiante | — | registro | transacción registerStudent | User + Student + Matrícula + Enrollment | credencial temporal entregada UNA vez al director, jamás en logs | código | ✅ |

## Fase 6 — Director / administración

| Flujo | Acción → endpoint | Regla verificada | Test | Estado |
|---|---|---|---|---|
| Estructura académica | GET /academic/*, POST secciones (admin) | relaciones nivel→grado→sección→2026→4 períodos, capacidad | integración | ✅ |
| Crear profesor | POST /teachers | PROF-xxx correlativo, DNI/email únicos | integración | ✅ |
| Asignar (tutor 1°–2° / polidocencia 3°–6°) | POST /teacher-assignments[/tutor] | un tutor por sección, sin doble docente, límites MAX_POLIDOCENCIA_* | integración | ✅ |
| Reasignar | POST /courses/:id/reassign | fila única uk_asig_cur_sec_anio actualizada + Course sync + Enrollment/notas intactas + REASSIGN | reasignación | ✅ |
| Desactivar profesor | PUT activo:false / DELETE | 409 con asignaciones activas (ambos endpoints) | profesor PUT | ✅ |
| Crear estudiante | registerStudent transaccional | EST-xxx, MAT-2026-xxx, Enrollment auto, rollback total, correlativos sin count()+1 | integración | ✅ |
| Matrícula única | POST /matriculas tras activa/retirada/trasladada | 409 siempre; UX deshabilita "Ya matriculado en 2026" | traslado/retiro | ✅ |
| Retiro | PATCH /matriculas {retirada} | Enrollment retiradas, historial intacto, pierde scopes | retirado | ✅ |
| Traslado externo | PATCH {trasladada} | mismo registro, sin 2.ª matrícula, historial intacto | traslado | ✅ |

## Fase 7 — Profesor (ámbito propio verificado)

Dashboard/cursos/secciones/estudiantes/notas/asistencia/materiales/actividades/LMS/predicción/alertas/mensajes:
todo deriva de `resolveStudentScope` (matrícula activa 2026 + Enrollment activa + curso asignado) y
`assertTeacherCourseAccess`/`assertStudentInCourseSection`. Notas 0–20 (rango fuera → 400 por schema);
asistencia solo 2026 con % derivado y recálculo en modificación/eliminación; predicción 409 sin datos /
503 sin modelo; alertas nueva→en_seguimiento→resuelta en scope; mensajería solo relacionada.
Cobertura: matrix + reasignación (anterior 403 / nuevo 200) + IDOR. ✅

## Fase 8 — Estudiante (solo propio)

Perfil/dashboard/cursos/notas/asistencia/materiales/actividades/LMS: `usuarioId` propio; IDs ajenos →
403/404 sin fuga. Sin datos: "—"/"Sin datos"/"Sin predicción" (verificado en vistas y exports).
Predicción: sin POST (403 por authorize); solo lectura de Prediction persistida. Mensajes: solo
profesores relacionados; Director↔Estudiante 403. Avisos: lectura global + curso, sin publicar. ✅

## Fase 9 — Transversales

- Predicción: 7 vars exactas (`buildMlPayload`); `prediction_source` ahora solo `"ml_model"` (P3:
  eliminado union con fallbacks que el schema zod jamás aceptaba). Sin modelo → 503.
- Alertas: umbral medio→medio+alto, alto→solo alto; dedup estudiante+nivel+abierta; historial.
- Dashboard: agregados reales con null (sin hardcode/mock/random/fallback; barrido de términos hecho:
  solo `placeholder=` de inputs y literales de tipos).
- Reportes: scopes por rol; "Sin predicción" sin nivel ficticio.
- AuditLog: LOGIN/LOGOUT/CREATE/UPDATE/DEACTIVATE/REASSIGN/UPSERT/CHANGE_PASSWORD + director solo lectura.
- Configuración: `systemConfig` persistida (institución, año, `alertas.nivel_minimo`), no localStorage.
- Notificaciones: por usuario, lectura y aislamiento verificados en rutas. ✅

## Fase 10 — Escenarios integrales

| Escenario | Cobertura |
|---|---|
| A estudiante nuevo (registro→matrícula→Enrollment→notas→asistencia→LMS→indicadores) | ✅ tests encadenados |
| B reasignación (A pierde, B obtiene, notas/Enrollment/vista estudiante intactas) | ✅ test dedicado |
| C retiro (scopes y salas caen, históricos quedan) | ✅ tests dedicado + mensajería |
| D traslado externo (sin 2.ª matrícula, historial intacto) | ✅ test dedicado |
| E ML no disponible (503, sin Prediction/Alert ficticia) | ✅ tests 503 existentes |
| F IDs manipulados (student/course/teacher/room/alert/prediction) | ✅ matrix + forjados |

## Cambios de BD en Fases 5–10
`No fue necesario modificar el schema durante las Fases 5–10.` (57 modelos, sin migraciones.)

## Pendiente (no bloquea cierre funcional)
Barrido visual interactivo por rol (sin browser en este entorno) → Fase 11+; ML productivo
(dataset autorizado); Data Seed V2 pospuesto.
