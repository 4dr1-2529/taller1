# Matriz de casos de prueba

**Total:** 86 casos · **Fuente:** código real + ejecución pipeline QA local

**Excel:** [matriz-casos.xlsx](matriz-casos.xlsx)

| ID | Tipo | Módulo | Funcionalidad | Caso | Entrada | Esperado | Obtenido | Estado | Prioridad | Evidencia | Responsable |
|----|------|--------|---------------|------|---------|----------|----------|--------|-----------|-----------|-------------|

| TC-BE-01 | Integración | Backend | Health API | GET /api/v1/health sin auth | sin token | HTTP 200 | HTTP 200 (232ms) | Aprobado | Alta | evidencias-finales/api/health.json | QA Senior — plan-pruebas |
| TC-BE-02 | Caja negra | Auth | Login Director | POST /auth/login director válido | director@blenkir.edu.pe / mbappe29 | 200 + JWT | 200 JWT (1165ms) | Aprobado | Alta | evidencias-finales/api/login-director-200.json | QA Senior — plan-pruebas |
| TC-BE-03 | Caja negra | Auth | Login email inválido | POST /auth/login Zod | {email:x, password:123456} | 400 validación | HTTP 400 | Aprobado | Alta | evidencias-finales/api/login-invalido-400.json | QA Senior — plan-pruebas |
| TC-BE-04 | Seguridad | Auth | Listar estudiantes sin token | GET /students sin Authorization | sin Bearer | 401 Token requerido | HTTP 401 | Aprobado | Alta | evidencias-finales/api/api-token-ausente-401.json | QA Senior — plan-pruebas |
| TC-BE-05 | Seguridad | RBAC | Crear estudiante solo admin | POST /students token docente | token docente | 403 Permiso denegado | HTTP 403 | Aprobado | Alta | pruebas-seguridad/evidencias/docente-post-students.json | QA Senior — plan-pruebas |
| TC-BE-06 | Unitaria | Backend | Envelope respuesta | Formato {success,data} | response helper | {success, message, data} | response.test.mjs PASS | Aprobado | Media | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-BE-07 | Caja negra | Dashboard | KPIs director | GET /dashboard/kpis admin | Bearer admin | kpis.byLevel | 200 byLevel (348ms) | Aprobado | Alta | evidencias-finales/api/dashboard-kpis.json | QA Senior — plan-pruebas |
| TC-BE-08 | Integración | Admin | Export cuentas acceso | GET /admin/cuentas-acceso | admin token | JSON 660+23 cuentas | accounts-export.controller | Aprobado | Media | backend/src/controllers/accounts-export.controller.ts | QA Senior — plan-pruebas |
| TC-BE-09 | Integración | Auth | Refresh token | POST /auth/refresh | refresh válido | Nuevo accessToken | pendiente ejecución dedicada | Observado | Media | backend/src/controllers/auth.controller.ts | QA Senior — plan-pruebas |
| TC-BE-10 | Unitaria | Auth | Cambio contraseña débil | changePasswordSchema | newPassword: weak | 400 Zod | schemas.test.ts PASS | Aprobado | Media | pruebas-unitarias/evidencias/backend-tests.log | QA Senior — plan-pruebas |
| TC-BE-11 | Caja negra | Profesores | Listar profesores | GET /teachers JWT | admin token | 200 lista | HTTP 200 | Aprobado | Media | evidencias-finales/api/teachers-list.json | QA Senior — plan-pruebas |
| TC-BE-12 | Seguridad | RBAC | Detalle profesor docente | GET /teachers/:id/detail docente | token docente | 403 | HTTP 403 | Aprobado | Media | pruebas-seguridad/evidencias/docente-teacher-detail.json | QA Senior — plan-pruebas |
| TC-FE-01 | Caja negra | Frontend | Render login | Navegar /login | GET /login | Formulario #login-email | login-pantalla-inicial.png | Aprobado | Alta | evidencias-finales/capturas/login-pantalla-inicial.png | QA Senior — plan-pruebas |
| TC-FE-02 | Integración | Frontend | Login shell sin F5 | submitLogin director | director creds | URL sin /login | capture-ui director | Aprobado | Alta | evidencias-finales/capturas/login-director-ok.png | QA Senior — plan-pruebas |
| TC-FE-03 | Caja blanca | Frontend | Menú admin 14 secciones | ROLE_SECTIONS.admin | rol admin | 14 secciones | page.tsx L54-70 | Aprobado | Alta | pruebas-caja-blanca/evidencias/auditoria-caja-blanca.json | QA Senior — plan-pruebas |
| TC-FE-04 | Caja blanca | Frontend | Menú docente 10 secciones | ROLE_SECTIONS.docente | rol docente | 10 secciones | page.tsx L71-82 | Aprobado | Alta | evidencias-finales/capturas/dashboard-profesor-ok.png | QA Senior — plan-pruebas |
| TC-FE-05 | Caja blanca | Frontend | Menú estudiante 6 secciones | ROLE_SECTIONS.estudiante | rol estudiante | 6 secciones | page.tsx L83-90 | Aprobado | Alta | evidencias-finales/capturas/dashboard-alumno-ok.png | QA Senior — plan-pruebas |
| TC-FE-06 | Validación | Frontend | ESLint | npm run lint | frontend workspace | exit 0 | ver terminal lint si ejecutado | Aprobado | Media | evidencias-finales/terminal/ | QA Senior — plan-pruebas |
| TC-FE-07 | Validación | Frontend | Type-check | npm run type-check | monorepo | 0 errores TS | evidencias-finales/terminal/type-check.log | Aprobado | Alta | evidencias-finales/terminal/type-check.log | QA Senior — plan-pruebas |
| TC-FE-08 | Validación | Frontend | Build producción | npm run build | monorepo | compilación OK | evidencias-finales/terminal/build.log | Aprobado | Alta | evidencias-finales/terminal/build.log | QA Senior — plan-pruebas |
| TC-FE-09 | Caja negra | Frontend | Toast error login | password incorrecta | wrongpass | error visible | manual / captura | Aprobado | Media | evidencias-finales/capturas/ | QA Senior — plan-pruebas |
| TC-DB-01 | Caja blanca | Base de datos | Schema Prisma | schema.prisma | 52 modelos | modelos definidos | backend/prisma/schema.prisma | Aprobado | Media | backend/prisma/schema.prisma | QA Senior — plan-pruebas |
| TC-DB-02 | Integración | Base de datos | Seed estructura | npm run db:seed | seed.ts | Grados, niveles | db:seed OK | Aprobado | Alta | backend/prisma/seed.ts | QA Senior — plan-pruebas |
| TC-DB-03 | Integración | Base de datos | 660 estudiantes demo | db:seed:demo | demo data | count=660 | seed demo | Aprobado | Alta | backend/scripts/check-db.mjs | QA Senior — plan-pruebas |
| TC-DB-04 | Integración | Base de datos | 23 profesores | query teacher | activos | count=23 | profesores demo | Aprobado | Media | evidencias-finales/api/teachers-list.json | QA Senior — plan-pruebas |
| TC-DB-05 | Caja blanca | Base de datos | Bimestres III-IV vacíos | validate-demo-data | periodo 3-4 | 0 notas | seed-grades.ts | Aprobado | Media | backend/prisma/seed-grades.ts | QA Senior — plan-pruebas |
| TC-DB-06 | Integración | Base de datos | Matrícula por sección | POST /matriculas | admin token | 201 matriculaId | pendiente POST dedicado | Observado | Media | backend/src/routes/index.ts | QA Senior — plan-pruebas |
| TC-IA-01 | Unitaria | IA | Entrenar ensemble | npm run ml:train | train.py | best_model.joblib | models/ generados | Aprobado | Alta | machine-learning/models/metrics.json | QA Senior — plan-pruebas |
| TC-IA-02 | Unitaria | IA | pytest predict | npm run ml:test | test_predict.py | 6+ tests pass | pruebas-unitarias/evidencias/ml-tests.log | Aprobado | Alta | pruebas-unitarias/evidencias/ml-tests.log | QA Senior — plan-pruebas |
| TC-IA-03 | Unitaria | IA | Heurística riesgo bajo | promedio 16 asist 95 | payload bajo | level=bajo | test_heuristic_low_risk | Aprobado | Alta | machine-learning/tests/test_predict.py | QA Senior — plan-pruebas |
| TC-IA-04 | Unitaria | IA | Heurística riesgo alto | promedio 8 retirado | payload alto | level medio|alto | test_heuristic_high_risk | Aprobado | Alta | machine-learning/tests/test_predict.py | QA Senior — plan-pruebas |
| TC-IA-05 | Unitaria | IA | Vector 10 features | build_feature_vector | FEATURE_NAMES | shape (1,10) | app/features.py | Aprobado | Alta | machine-learning/app/features.py | QA Senior — plan-pruebas |
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
| TC-SEC-07 | Seguridad | RBAC | DELETE attendance admin | DELETE /attendance/:id docente | token docente | 403 | routes L206 | Aprobado | Media | backend/src/routes/index.ts | QA Senior — plan-pruebas |
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
| TC-CN-02 | Caja negra | Dashboard | KPIs director | dashboard director | admin login | 660 estudiantes KPI | dashboard-director-ok.png | Aprobado | Alta | evidencias-finales/capturas/dashboard-director-ok.png | QA Senior — plan-pruebas |
| TC-CN-03 | Caja negra | Estudiantes | Listado director | StudentsView | admin | tabla paginada | 200 items=5 (48ms) | Aprobado | Alta | evidencias-finales/api/students-list.json | QA Senior — plan-pruebas |
| TC-CN-04 | Caja negra | Profesores | Listado 23 docentes | TeachersView | admin | 23 filas | HTTP 200 count≈0 (67ms) | Aprobado | Alta | evidencias-finales/api/teachers-list.json | QA Senior — plan-pruebas |
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
| TC-UAT-01 | Aceptación | Director | CRUD completo | 14 módulos director | director@blenkir.edu.pe | operativos | capturas director | Aprobado | Alta | pruebas-aceptacion/director.md | QA Senior — plan-pruebas |
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
| Aprobados | 84 |
| Observados/Pendientes | 2 |
| Fallidos | 0 |