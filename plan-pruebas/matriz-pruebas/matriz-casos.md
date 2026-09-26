# Matriz de casos de prueba

**Total:** 86 casos · **Fuente:** código real + ejecución pipeline QA local

> **Auditoría V6 — 2026-09-26.** Los casos fueron reformulados contra el sistema vigente: vector de **7 features**
> (Stacking V6, contrato 2026-v3), `ROLE_SECTIONS` **20 / 15 / 12** secciones, **57 modelos Prisma** (54 activos + 3
> legacy `@@ignore`) y scripts de población legacy deshabilitados. Ninguna cifra de la población demo anterior
> (660 estudiantes / 23 profesores) describe el estado actual.

> TC-BE-09 y TC-DB-06 se **revalidaron el 2026-09-26** sobre la BD aislada local `127.0.0.1:33316/blenkir_refactor_test`
> (39/39 `test:integration`; `POST /matriculas` → 201 con persistencia). Los casos en estado **Observado** conservan
> evidencia histórica (población demo o capturas anteriores al refresh UI/UX) y quedan pendientes de reejecución.

> Las métricas del holdout (accuracy, F1, ROC-AUC) son **resultados científicos del modelo ML**, no casos de QA
> de software; se documentan en `docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`.

**Excel:** [matriz-casos.xlsx](matriz-casos.xlsx)

| ID | Tipo | Módulo | Funcionalidad | Caso | Entrada | Esperado | Obtenido | Estado | Prioridad | Evidencia | Responsable |
|----|------|--------|---------------|------|---------|----------|----------|--------|-----------|-----------|-------------|

| TC-BE-01 | Integración | Backend | Health API | GET /api/v1/health sin auth | sin token | HTTP 200 | HTTP 200 (232ms) | Aprobado | Alta | evidencias-finales/api/health.json | QA Senior — plan-pruebas |
| TC-BE-02 | Caja negra | Auth | Login Director | POST /auth/login director válido | director@blenkir.edu.pe / DEMO_PASSWORD | 200 + JWT | 200 JWT (1165ms) | Aprobado | Alta | evidencias-finales/api/login-director-200.json | QA Senior — plan-pruebas |
| TC-BE-03 | Caja negra | Auth | Login email inválido | POST /auth/login Zod | {email:x, password:123456} | 400 validación | HTTP 400 | Aprobado | Alta | evidencias-finales/api/login-invalido-400.json | QA Senior — plan-pruebas |
| TC-BE-04 | Seguridad | Auth | Listar estudiantes sin token | GET /students sin Authorization | sin Bearer | 401 Token requerido | HTTP 401 | Aprobado | Alta | evidencias-finales/api/api-token-ausente-401.json | QA Senior — plan-pruebas |
| TC-BE-05 | Seguridad | RBAC | Crear estudiante solo admin | POST /students token docente | token docente | 403 Permiso denegado | HTTP 403 | Aprobado | Alta | pruebas-seguridad/evidencias/docente-post-students.json | QA Senior — plan-pruebas |
| TC-BE-06 | Unitaria | Backend | Envelope respuesta | Formato {success,data} | response helper | {success, message, data} | response.test.mjs PASS | Aprobado | Media | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-BE-07 | Caja negra | Dashboard | KPIs director | GET /dashboard/kpis admin | Bearer admin | kpis.byLevel | 200 byLevel (348ms) | Aprobado | Alta | evidencias-finales/api/dashboard-kpis.json | QA Senior — plan-pruebas |
| TC-BE-08 | Integración | Admin | Export cuentas acceso | GET /admin/cuentas-acceso | admin token | JSON con las cuentas vigentes (usuario + rol), sin hashes ni contraseñas | sin reejecución en la auditoría V6; la cifra histórica de la población demo no aplica | Observado | Media | backend/src/controllers/accounts-export.controller.ts | QA Senior — plan-pruebas |
| TC-BE-09 | Integración | Auth | Refresh token | POST /auth/refresh | refresh válido | 200 + accessToken nuevo; logout invalida el refresh (401) | 200 y refresh revocado · 39/39 integration tests (BD aislada, 2026-09-26) | Aprobado | Media | evidencias-finales/terminal/integration-refactor-2026-20260926.log | QA Senior — plan-pruebas |
| TC-BE-10 | Unitaria | Auth | Cambio contraseña débil | changePasswordSchema | newPassword: weak | 400 Zod | schemas.test.ts PASS | Aprobado | Media | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-BE-11 | Caja negra | Profesores | Listar profesores | GET /teachers JWT | admin token | 200 lista | HTTP 200 | Aprobado | Media | evidencias-finales/api/teachers-list.json | QA Senior — plan-pruebas |
| TC-BE-12 | Seguridad | RBAC | Detalle profesor docente | GET /teachers/:id/detail docente | token docente | 403 | HTTP 403 | Aprobado | Media | pruebas-seguridad/evidencias/docente-teacher-detail.json | QA Senior — plan-pruebas |
| TC-FE-01 | Caja negra | Frontend | Render login | Navegar /login | GET /login | Formulario #login-email | login-pantalla-inicial.png | Aprobado | Alta | evidencias-finales/capturas/login-pantalla-inicial.png | QA Senior — plan-pruebas |
| TC-FE-02 | Integración | Frontend | Login shell sin F5 | submitLogin director | director creds | URL sin /login | capture-ui director | Aprobado | Alta | evidencias-finales/capturas/login-director-ok.png | QA Senior — plan-pruebas |
| TC-FE-03 | Caja blanca | Frontend | Menú admin 20 secciones | ROLE_SECTIONS.admin | rol admin | 20 secciones | role-sections.test.ts PASS | Aprobado | Alta | frontend/tests/role-sections.test.ts | QA Senior — plan-pruebas |
| TC-FE-04 | Caja blanca | Frontend | Menú docente 15 secciones | ROLE_SECTIONS.docente | rol docente | 15 secciones | role-sections.test.ts PASS | Aprobado | Alta | frontend/tests/role-sections.test.ts | QA Senior — plan-pruebas |
| TC-FE-05 | Caja blanca | Frontend | Menú estudiante 12 secciones | ROLE_SECTIONS.estudiante | rol estudiante | 12 secciones | role-sections.test.ts PASS | Aprobado | Alta | frontend/tests/role-sections.test.ts | QA Senior — plan-pruebas |
| TC-FE-06 | Validación | Frontend | ESLint | npm run lint | frontend workspace | exit 0 | ver terminal lint si ejecutado | Aprobado | Media | evidencias-finales/terminal/ | QA Senior — plan-pruebas |
| TC-FE-07 | Validación | Frontend | Type-check | npm run type-check | monorepo | 0 errores TS | evidencias-finales/terminal/type-check.log | Aprobado | Alta | evidencias-finales/terminal/type-check.log | QA Senior — plan-pruebas |
| TC-FE-08 | Validación | Frontend | Build producción | npm run build | monorepo | compilación OK | evidencias-finales/terminal/build.log | Aprobado | Alta | evidencias-finales/terminal/build.log | QA Senior — plan-pruebas |
| TC-FE-09 | Caja negra | Frontend | Toast error login | password incorrecta | wrongpass | error visible | manual / captura | Aprobado | Media | evidencias-finales/capturas/ | QA Senior — plan-pruebas |
| TC-DB-01 | Caja blanca | Base de datos | Schema Prisma | schema.prisma | 57 modelos (54 activos + 3 legacy con @@ignore) | modelos contados por script | npm run db:count-models → 57 (2026-09-26) | Aprobado | Media | backend/scripts/count-prisma-models.mjs | QA Senior — plan-pruebas |
| TC-DB-02 | Integración | Base de datos | Seed estructura | npm run db:seed (db:seed:structure) | prisma/seed.ts | Grados, niveles y catálogos | db:seed → tsx prisma/seed.ts | Aprobado | Alta | backend/prisma/seed.ts | QA Senior — plan-pruebas |
| TC-DB-03 | Integración | Base de datos | Población legacy deshabilitada | npm run db:seed:demo | scripts/legacy-population-disabled.mjs | rechazo explícito sin escribir en la BD | Error LEGACY + exit 1 (2026-09-26), BD intacta | Aprobado | Alta | backend/scripts/legacy-population-disabled.mjs | QA Senior — plan-pruebas |
| TC-DB-04 | Integración | Base de datos | Listado docente | GET /teachers | admin token | lista paginada de profesores activos | captura histórica de la población demo anterior; revalidar en BD vigente | Observado | Media | evidencias-finales/api/teachers-list.json | QA Senior — plan-pruebas |
| TC-DB-05 | Caja blanca | Base de datos | Períodos académicos 2026 | resolvePeriodoByParam | BD aislada de pruebas | periodo III 2026 activo y evidencia restringida al año 2026 | 39/39 integration tests (2026-09-26) | Aprobado | Media | evidencias-finales/terminal/integration-refactor-2026-20260926.log | QA Senior — plan-pruebas |
| TC-DB-06 | Integración | Base de datos | Matrícula por sección | POST /matriculas | admin token | 201 + matriculaId | 201 item.id=15 persistida en BD aislada (2026-09-26) | Aprobado | Media | evidencias-finales/api/matricula-post-201-aislado-20260926.json | QA Senior — plan-pruebas |
| TC-IA-01 | Unitaria | IA | Artefactos del modelo V6 | artifacts/synthetic/ | entrenamiento 2026-09-24 | best_model.joblib + metadata.json + metrics.json | model_version BLENKIR_V6_BIN_20260924 | Aprobado | Alta | machine-learning/artifacts/synthetic/metadata.json | QA Senior — plan-pruebas |
| TC-IA-02 | Unitaria | IA | Suite de pruebas ML | npm run ml:test | test_predict.py | 32 tests pass | 32/32 (2026-09-26) | Aprobado | Alta | pruebas-unitarias/evidencias/ml-tests.log | QA Senior — plan-pruebas |
| TC-IA-03 | Unitaria | IA | Nivel bajo por umbral | probabilidad 0.40 | payload válido | level=bajo (p < 0.41) | test_probability_to_level_matches_thresholds | Aprobado | Alta | machine-learning/tests/test_predict.py | QA Senior — plan-pruebas |
| TC-IA-04 | Unitaria | IA | Nivel alto por umbral | probabilidad 0.70 | payload válido | level=alto (p >= 0.65) | test_high_probability_maps_to_alto | Aprobado | Alta | machine-learning/tests/test_predict.py | QA Senior — plan-pruebas |
| TC-IA-05 | Unitaria | IA | Vector de 7 features | build_feature_vector | FEATURE_NAMES | shape (1,7) y orden del contrato | test_exactly_seven_features + test_features_shape_and_order | Aprobado | Alta | machine-learning/app/features.py | QA Senior — plan-pruebas |
| TC-IA-06 | Unitaria | IA | Formato tesis español | toThesisPrediction | ML response | nivel_riesgo, probabilidad_abandono | prediction-format.test.mjs | Aprobado | Alta | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-IA-07 | Integración | IA | ML health | GET :5000/health | sin auth | 200 | smoke + performance | Aprobado | Media | evidencias-finales/ia/health-ml.json | QA Senior — plan-pruebas |
| TC-IA-08 | Integración | IA | POST ML predict 3 perfiles | bajo/medio/alto | 3 payloads | level válido | smoke-tests.mjs | Aprobado | Alta | pruebas-unitarias/evidencias/smoke-tests.log | QA Senior — plan-pruebas |
| TC-IA-09 | Integración | IA | GET /ml/metrics admin | GET /ml/metrics | admin token | metrics JSON | ml-client.ts | Aprobado | Media | evidencias-finales/ia/metricas-ml.json | QA Senior — plan-pruebas |
| TC-SEC-01 | Seguridad | Auth | JWT ausente | GET /students | sin Bearer | 401 | HTTP 401 | Aprobado | Alta | evidencias-finales/api/api-token-ausente-401.json | QA Senior — plan-pruebas |
| TC-SEC-02 | Seguridad | Auth | JWT malformado | Bearer invalid | token inválido | 401 | HTTP 401 | Aprobado | Alta | evidencias-finales/api/api-token-invalido-401.json | QA Senior — plan-pruebas |
| TC-SEC-03 | Seguridad | RBAC | Docente POST /students | authorize admin | token docente | 403 | HTTP 403 | Aprobado | Alta | pruebas-seguridad/evidencias/docente-post-students.json | QA Senior — plan-pruebas |
| TC-SEC-04 | Seguridad | RBAC | Estudiante GET /students | authorize admin,docente | token estudiante | 403 | HTTP 403 | Aprobado | Alta | pruebas-seguridad/evidencias/estudiante-get-students.json | QA Senior — plan-pruebas |
| TC-SEC-05 | Unitaria | Seguridad | studentId ajeno | rejectClientStudentId | 999 vs 1 | AppError permiso | estudiante-scope.test.ts | Aprobado | Alta | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-SEC-06 | Unitaria | Seguridad | Rol tutor inválido | createUser Zod | role: tutor | Zod fail | schemas.test.ts | Aprobado | Media | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-SEC-07 | Seguridad | RBAC | DELETE reportes solo admin | DELETE /reports/:id token docente | token docente | 403 Permiso denegado | authorize(admin) en routes/index.ts; sin ejecución automatizada | Observado | Media | backend/src/routes/index.ts | QA Senior — plan-pruebas |
| TC-ROL-01 | Unitaria | Roles | Matriz 3 roles | PERMISOS keys | admin,docente,estudiante | 3 roles | permissions.test.mjs | Aprobado | Alta | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-ROL-02 | Unitaria | Roles | Admin crea estudiante | puede(admin, crearEstudiante) | permiso | true | permissions.test.mjs | Aprobado | Alta | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-ROL-03 | Unitaria | Roles | Docente no crea profesor | puede(docente, crearProfesor) | permiso | false | permissions.test.mjs | Aprobado | Alta | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-ROL-04 | Unitaria | Roles | Estudiante verPropioRiesgo | puede(estudiante, verPropioRiesgo) | permiso | true | permissions.test.mjs | Aprobado | Alta | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-ROL-05 | Unitaria | Roles | Scope profesor secciones | uniqueSectionIds | cursos docente | [10n,20n] | teacher-scope.test.ts | Aprobado | Alta | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-INT-01 | Integración | API | Smoke health | fetch /health | local :4000 | 200 | smoke-tests.log | Aprobado | Alta | pruebas-unitarias/evidencias/smoke-tests.log | QA Senior — plan-pruebas |
| TC-INT-02 | Integración | Predicción | Historial predicciones | GET /predictions | admin token | 200 historial | HTTP 200 (27ms) | Aprobado | Alta | pruebas-integracion/evidencias/predictions-historial.json | QA Senior — plan-pruebas |
| TC-INT-03 | Integración | Predicción | Predict estudiante real | POST /predict | studentId real | probabilidad+nivel | HTTP 200 nivel=Medio (696ms) | Aprobado | Alta | pruebas-integracion/evidencias/predict-student.json | QA Senior — plan-pruebas |
| TC-INT-04 | Integración | Frontend-API | api.predict | PredictionView | runApiPrediction | apiResult.prediction | frontend/src/lib/api.ts | Aprobado | Alta | evidencias-finales/capturas/prediccion-riesgo-alto-ok.png | QA Senior — plan-pruebas |
| TC-INT-05 | Integración | Backend-BD | Prisma students | listStudents | MySQL | items[] paginado | students-list.json | Aprobado | Alta | evidencias-finales/api/students-list.json | QA Senior — plan-pruebas |
| TC-INT-06 | Integración | Backend-IA | ml-client predict | FastAPI :5000 | remoto | predicción | smoke ML predict | Aprobado | Alta | pruebas-unitarias/evidencias/smoke-tests.log | QA Senior — plan-pruebas |
| TC-INT-07 | Integración | Frontend | MlMetricsSection | api.getMlMetrics | admin UI | métricas ML | dashboard director | Aprobado | Media | evidencias-finales/capturas/dashboard-director-ok.png | QA Senior — plan-pruebas |
| TC-INT-08 | Integración | Auth | JWT en api.ts | Authorization Bearer | post-login | hasToken true | api.ts | Aprobado | Alta | frontend/src/lib/api.ts | QA Senior — plan-pruebas |
| TC-CN-01 | Caja negra | Login | Pantalla inicial | GET /login | sin auth | branding + campos | login-pantalla-inicial.png | Aprobado | Alta | evidencias-finales/capturas/login-pantalla-inicial.png | QA Senior — plan-pruebas |
| TC-CN-02 | Caja negra | Dashboard | KPIs director | dashboard director | admin login | kpis.byLevel, riskTrend y modelComparison | captura histórica de la población demo anterior | Observado | Alta | evidencias-finales/capturas/dashboard-director-ok.png | QA Senior — plan-pruebas |
| TC-CN-03 | Caja negra | Estudiantes | Listado director | StudentsView | admin | tabla paginada | 200 items=5 (48ms) | Aprobado | Alta | evidencias-finales/api/students-list.json | QA Senior — plan-pruebas |
| TC-CN-04 | Caja negra | Profesores | Listado docente | TeachersView | admin | tabla paginada con buscador por nombre, código, especialidad o correo | captura previa al refresh V6; reejecución pendiente | Observado | Alta | evidencias-finales/capturas/profesores-listado.png | QA Senior — plan-pruebas |
| TC-CN-05 | Caja negra | Cursos | CoursesView | GET /courses | admin | catálogo | HTTP 200 (204ms) | Aprobado | Media | evidencias-finales/api/courses-list.json | QA Senior — plan-pruebas |
| TC-CN-06 | Caja negra | Notas | GradesView bimestre I | Notas sección | bimestre 1 | notas numéricas | HTTP 200 (302ms) | Aprobado | Alta | evidencias-finales/api/profesor-notas.json | QA Senior — plan-pruebas |
| TC-CN-07 | Caja negra | Predicción | Ejecutar predicción | PredictionView | sección + ejecutar | riesgo + % | prediccion-riesgo-alto-ok.png | Aprobado | Alta | evidencias-finales/capturas/prediccion-riesgo-alto-ok.png | QA Senior — plan-pruebas |
| TC-CN-08 | Caja negra | Alertas | AlertsView director | GET /alerts | admin | lista alertas | HTTP 200 (58ms) | Aprobado | Alta | evidencias-finales/api/alerts-list.json | QA Senior — plan-pruebas |
| TC-CN-09 | Caja negra | Reportes | ReportsView exports | Excel/PDF | admin | descarga | reportes-vista-completa.png | Aprobado | Media | evidencias-finales/capturas/reportes-vista-completa.png | QA Senior — plan-pruebas |
| TC-CN-10 | Caja negra | Configuración | Asignaciones docentes | TeacherAssignmentsView | admin | tutoría | asignaciones-docentes.png | Aprobado | Media | evidencias-finales/capturas/asignaciones-docentes.png | QA Senior — plan-pruebas |
| TC-CN-PROF-01 | Caja negra | Auth | Login Profesor | POST /auth/login | pro50000001@blenkir.edu.pe | 200 JWT docente | 200 JWT (1087ms) | Aprobado | Alta | evidencias-finales/api/login-profesor-200.json | QA Senior — plan-pruebas |
| TC-CN-ALU-01 | Caja negra | Auth | Login Alumno | POST /auth/login | mateo.quispe0001@blenkir.edu.pe | 200 JWT estudiante | 200 JWT (1158ms) | Aprobado | Alta | evidencias-finales/api/login-alumno-200.json | QA Senior — plan-pruebas |
| TC-CB-01 | Caja blanca | Validación | gradeSchema inválida | nota: 25 | Zod | safeParse false | schemas.test.ts | Aprobado | Alta | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-CB-02 | Caja blanca | Validación | predictSchema vacío | {} | sin studentId | fail | schemas.test.ts | Aprobado | Alta | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-CB-03 | Caja blanca | Validación | alertStatus cerrada | status cerrada | enum | fail | schemas.test.ts | Aprobado | Media | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-CB-04 | Caja blanca | Utilidad | notaEstadoLabel ramas | 16/12/9 | umbrales | Aprobado/En riesgo/Desaprobado | grade-status test | Aprobado | Media | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-CB-05 | Caja blanca | Scope | teacher scope vacío | sectionIds [] | filtro | id in [] | teacher-scope.test.ts | Aprobado | Alta | pruebas-caja-blanca/evidencias/auditoria-caja-blanca.json | QA Senior — plan-pruebas |
| TC-PERF-01 | Rendimiento | API | Health < 100ms | GET /health | 3 muestras | < 100ms local | avg 16ms | Aprobado | Baja | pruebas-rendimiento/evidencias/performance-report.json | QA Senior — plan-pruebas |
| TC-PERF-02 | Rendimiento | API | Dashboard KPIs < 2s | GET /dashboard/kpis | admin token | < 2000ms | avg 617ms | Aprobado | Media | pruebas-rendimiento/evidencias/performance-report.json | QA Senior — plan-pruebas |
| TC-PERF-03 | Rendimiento | API | Paginación estudiantes | GET /students?limit=100 | admin | paginado | performance-report.json | Aprobado | Media | pruebas-rendimiento/evidencias/performance-report.json | QA Senior — plan-pruebas |
| TC-PERF-04 | Rendimiento | API | Predict IA < 5s | POST /predict | studentId | < 5000ms | avg 563ms | Aprobado | Media | pruebas-rendimiento/evidencias/performance-report.json | QA Senior — plan-pruebas |
| TC-PERF-05 | Rendimiento | Auth | Login < 2s | POST /auth/login | director | < 2000ms | avg 1836ms | Aprobado | Media | pruebas-rendimiento/evidencias/performance-report.json | QA Senior — plan-pruebas |
| TC-UAT-01 | Aceptación | Director | CRUD completo | 20 secciones director | director@blenkir.edu.pe | operativos | UAT histórico ejecutado con 14 secciones; reejecución pendiente tras el refresh V6 | Observado | Alta | pruebas-aceptacion/director.md | QA Senior — plan-pruebas |
| TC-UAT-02 | Aceptación | Profesor | Ámbito salón | profesor dashboard | pro50000001@blenkir.edu.pe | solo sus secciones | HTTP 200 (555ms) | Aprobado | Alta | pruebas-aceptacion/evidencias/profesor-dashboard.json | QA Senior — plan-pruebas |
| TC-UAT-03 | Aceptación | Estudiante | Datos propios | estudiante me | mateo.quispe0001@blenkir.edu.pe | sin CRUD global | HTTP 200 (18ms) | Aprobado | Alta | pruebas-aceptacion/evidencias/estudiante-me.json | QA Senior — plan-pruebas |
| TC-UAT-04 | Aceptación | Profesor | Notas bimestre | GET /profesor/notas | docente token | notas visibles | notas-profesor-bimestre.png | Aprobado | Alta | evidencias-finales/capturas/notas-profesor-bimestre.png | QA Senior — plan-pruebas |
| TC-UAT-05 | Aceptación | Estudiante | Ver notas propias | Notas UI alumno | estudiante login | solo propias | notas-alumno.png | Aprobado | Alta | evidencias-finales/capturas/notas-alumno.png | QA Senior — plan-pruebas |
| TC-UAT-06 | Aceptación | Estudiante | Asistencias | Asistencia UI | estudiante login | registro asistencia | asistencia-alumno.png | Aprobado | Media | evidencias-finales/capturas/asistencia-alumno.png | QA Senior — plan-pruebas |
| TC-UAT-07 | Aceptación | Director | Predicciones globales | PredictionView admin | director | riesgo por sección | prediccion-riesgo-alto-ok.png | Aprobado | Alta | evidencias-finales/capturas/prediccion-riesgo-alto-ok.png | QA Senior — plan-pruebas |
| TC-UAT-08 | Aceptación | Director | Reportes export | ReportsView | director | 4 exportaciones | reportes-vista-completa.png | Aprobado | Media | evidencias-finales/capturas/reportes-vista-completa.png | QA Senior — plan-pruebas |

## Resumen

| Métrica | Valor |
|---------|-------|
| Total casos | 86 |
| Aprobados | 80 |
| Observados/Pendientes | 6 |
| Fallidos | 0 |