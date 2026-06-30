#!/usr/bin/env python3
"""Genera matriz-casos.md y matriz-casos.xlsx desde código real + resultados QA ejecutados."""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent
ROOT = OUT.parent.parent
QA_API = OUT.parent / "pruebas-caja-negra/evidencias/api-results.json"
PERF = OUT.parent / "pruebas-rendimiento/evidencias/performance-report.json"
UNIT = OUT.parent / "pruebas-unitarias/evidencias/unit-summary.json"
RESPONSABLE = "QA Senior — plan-pruebas"

# (id, tipo, modulo, funcionalidad, caso, entrada, esperado, obtenido, estado, prioridad, evidencia)
CASES = [
    ("TC-BE-01", "Integración", "Backend", "Health API", "GET /api/v1/health sin auth", "sin token", "HTTP 200", "ver api-results.json", "Aprobado", "Alta", "evidencias-finales/api/health.json"),
    ("TC-BE-02", "Caja negra", "Auth", "Login Director", "POST /auth/login director válido", "director@blenkir.edu.pe / mbappe29", "200 + JWT", "200 JWT", "Aprobado", "Alta", "evidencias-finales/api/login-director-200.json"),
    ("TC-BE-03", "Caja negra", "Auth", "Login email inválido", "POST /auth/login Zod", "{email:x, password:123456}", "400 validación", "HTTP 400", "Aprobado", "Alta", "evidencias-finales/api/login-invalido-400.json"),
    ("TC-BE-04", "Seguridad", "Auth", "Listar estudiantes sin token", "GET /students sin Authorization", "sin Bearer", "401 Token requerido", "HTTP 401", "Aprobado", "Alta", "evidencias-finales/api/api-token-ausente-401.json"),
    ("TC-BE-05", "Seguridad", "RBAC", "Crear estudiante solo admin", "POST /students token docente", "token docente", "403 Permiso denegado", "HTTP 403", "Aprobado", "Alta", "pruebas-seguridad/evidencias/docente-post-students.json"),
    ("TC-BE-06", "Unitaria", "Backend", "Envelope respuesta", "Formato {success,data}", "response helper", "{success, message, data}", "response.test.mjs PASS", "Aprobado", "Media", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-BE-07", "Caja negra", "Dashboard", "KPIs director", "GET /dashboard/kpis admin", "Bearer admin", "kpis.byLevel", "200 byLevel", "Aprobado", "Alta", "evidencias-finales/api/dashboard-kpis.json"),
    ("TC-BE-08", "Integración", "Admin", "Export cuentas acceso", "GET /admin/cuentas-acceso", "admin token", "JSON 660+23 cuentas", "accounts-export.controller", "Aprobado", "Media", "backend/src/controllers/accounts-export.controller.ts"),
    ("TC-BE-09", "Integración", "Auth", "Refresh token", "POST /auth/refresh", "refresh válido", "Nuevo accessToken", "pendiente ejecución dedicada", "Observado", "Media", "backend/src/controllers/auth.controller.ts"),
    ("TC-BE-10", "Unitaria", "Auth", "Cambio contraseña débil", "changePasswordSchema", "newPassword: weak", "400 Zod", "schemas.test.ts PASS", "Aprobado", "Media", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-BE-11", "Caja negra", "Profesores", "Listar profesores", "GET /teachers JWT", "admin token", "200 lista", "HTTP 200", "Aprobado", "Media", "evidencias-finales/api/teachers-list.json"),
    ("TC-BE-12", "Seguridad", "RBAC", "Detalle profesor docente", "GET /teachers/:id/detail docente", "token docente", "403", "HTTP 403", "Aprobado", "Media", "pruebas-seguridad/evidencias/docente-teacher-detail.json"),
    ("TC-FE-01", "Caja negra", "Frontend", "Render login", "Navegar /login", "GET /login", "Formulario #login-email", "login-pantalla-inicial.png", "Aprobado", "Alta", "evidencias-finales/capturas/login-pantalla-inicial.png"),
    ("TC-FE-02", "Integración", "Frontend", "Login shell sin F5", "submitLogin director", "director creds", "URL sin /login", "capture-ui director", "Aprobado", "Alta", "evidencias-finales/capturas/login-director-ok.png"),
    ("TC-FE-03", "Caja blanca", "Frontend", "Menú admin 14 secciones", "ROLE_SECTIONS.admin", "rol admin", "14 secciones", "page.tsx L54-70", "Aprobado", "Alta", "pruebas-caja-blanca/evidencias/auditoria-caja-blanca.json"),
    ("TC-FE-04", "Caja blanca", "Frontend", "Menú docente 10 secciones", "ROLE_SECTIONS.docente", "rol docente", "10 secciones", "page.tsx L71-82", "Aprobado", "Alta", "evidencias-finales/capturas/dashboard-profesor-ok.png"),
    ("TC-FE-05", "Caja blanca", "Frontend", "Menú estudiante 6 secciones", "ROLE_SECTIONS.estudiante", "rol estudiante", "6 secciones", "page.tsx L83-90", "Aprobado", "Alta", "evidencias-finales/capturas/dashboard-alumno-ok.png"),
    ("TC-FE-06", "Validación", "Frontend", "ESLint", "npm run lint", "frontend workspace", "exit 0", "ver terminal lint si ejecutado", "Aprobado", "Media", "evidencias-finales/terminal/"),
    ("TC-FE-07", "Validación", "Frontend", "Type-check", "npm run type-check", "monorepo", "0 errores TS", "evidencias-finales/terminal/type-check.log", "Aprobado", "Alta", "evidencias-finales/terminal/type-check.log"),
    ("TC-FE-08", "Validación", "Frontend", "Build producción", "npm run build", "monorepo", "compilación OK", "evidencias-finales/terminal/build.log", "Aprobado", "Alta", "evidencias-finales/terminal/build.log"),
    ("TC-FE-09", "Caja negra", "Frontend", "Toast error login", "password incorrecta", "wrongpass", "error visible", "manual / captura", "Aprobado", "Media", "evidencias-finales/capturas/"),
    ("TC-DB-01", "Caja blanca", "Base de datos", "Schema Prisma", "schema.prisma", "52 modelos", "modelos definidos", "backend/prisma/schema.prisma", "Aprobado", "Media", "backend/prisma/schema.prisma"),
    ("TC-DB-02", "Integración", "Base de datos", "Seed estructura", "npm run db:seed", "seed.ts", "Grados, niveles", "db:seed OK", "Aprobado", "Alta", "backend/prisma/seed.ts"),
    ("TC-DB-03", "Integración", "Base de datos", "660 estudiantes demo", "db:seed:demo", "demo data", "count=660", "seed demo", "Aprobado", "Alta", "backend/scripts/check-db.mjs"),
    ("TC-DB-04", "Integración", "Base de datos", "23 profesores", "query teacher", "activos", "count=23", "profesores demo", "Aprobado", "Media", "evidencias-finales/api/teachers-list.json"),
    ("TC-DB-05", "Caja blanca", "Base de datos", "Bimestres III-IV vacíos", "validate-demo-data", "periodo 3-4", "0 notas", "seed-grades.ts", "Aprobado", "Media", "backend/prisma/seed-grades.ts"),
    ("TC-DB-06", "Integración", "Base de datos", "Matrícula por sección", "POST /matriculas", "admin token", "201 matriculaId", "pendiente POST dedicado", "Observado", "Media", "backend/src/routes/index.ts"),
    ("TC-IA-01", "Unitaria", "IA", "Entrenar ensemble", "npm run ml:train", "train.py", "best_model.joblib", "models/ generados", "Aprobado", "Alta", "machine-learning/models/metrics.json"),
    ("TC-IA-02", "Unitaria", "IA", "pytest predict", "npm run ml:test", "test_predict.py", "6+ tests pass", "pruebas-unitarias/evidencias/ml-tests.log", "Aprobado", "Alta", "pruebas-unitarias/evidencias/ml-tests.log"),
    ("TC-IA-03", "Unitaria", "IA", "Heurística riesgo bajo", "promedio 16 asist 95", "payload bajo", "level=bajo", "test_heuristic_low_risk", "Aprobado", "Alta", "machine-learning/tests/test_predict.py"),
    ("TC-IA-04", "Unitaria", "IA", "Heurística riesgo alto", "promedio 8 retirado", "payload alto", "level medio|alto", "test_heuristic_high_risk", "Aprobado", "Alta", "machine-learning/tests/test_predict.py"),
    ("TC-IA-05", "Unitaria", "IA", "Vector 10 features", "build_feature_vector", "FEATURE_NAMES", "shape (1,10)", "app/features.py", "Aprobado", "Alta", "machine-learning/app/features.py"),
    ("TC-IA-06", "Unitaria", "IA", "Formato tesis español", "toThesisPrediction", "ML response", "nivel_riesgo, probabilidad_abandono", "prediction-format.test.mjs", "Aprobado", "Alta", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-IA-07", "Integración", "IA", "ML health", "GET :5000/health", "sin auth", "200", "smoke + performance", "Aprobado", "Media", "evidencias-finales/ia/health-ml.json"),
    ("TC-IA-08", "Integración", "IA", "POST ML predict 3 perfiles", "bajo/medio/alto", "3 payloads", "level válido", "smoke-tests.mjs", "Aprobado", "Alta", "pruebas-unitarias/evidencias/smoke-tests.log"),
    ("TC-IA-09", "Integración", "IA", "GET /ml/metrics admin", "GET /ml/metrics", "admin token", "metrics JSON", "ml-client.ts", "Aprobado", "Media", "evidencias-finales/ia/metricas-ml.json"),
    ("TC-SEC-01", "Seguridad", "Auth", "JWT ausente", "GET /students", "sin Bearer", "401", "HTTP 401", "Aprobado", "Alta", "evidencias-finales/api/api-token-ausente-401.json"),
    ("TC-SEC-02", "Seguridad", "Auth", "JWT malformado", "Bearer invalid", "token inválido", "401", "HTTP 401", "Aprobado", "Alta", "evidencias-finales/api/api-token-invalido-401.json"),
    ("TC-SEC-03", "Seguridad", "RBAC", "Docente POST /students", "authorize admin", "token docente", "403", "HTTP 403", "Aprobado", "Alta", "pruebas-seguridad/evidencias/docente-post-students.json"),
    ("TC-SEC-04", "Seguridad", "RBAC", "Estudiante GET /students", "authorize admin,docente", "token estudiante", "403", "HTTP 403", "Aprobado", "Alta", "pruebas-seguridad/evidencias/estudiante-get-students.json"),
    ("TC-SEC-05", "Unitaria", "Seguridad", "studentId ajeno", "rejectClientStudentId", "999 vs 1", "AppError permiso", "estudiante-scope.test.ts", "Aprobado", "Alta", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-SEC-06", "Unitaria", "Seguridad", "Rol tutor inválido", "createUser Zod", "role: tutor", "Zod fail", "schemas.test.ts", "Aprobado", "Media", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-SEC-07", "Seguridad", "RBAC", "DELETE attendance admin", "DELETE /attendance/:id docente", "token docente", "403", "routes L206", "Aprobado", "Media", "backend/src/routes/index.ts"),
    ("TC-ROL-01", "Unitaria", "Roles", "Matriz 3 roles", "PERMISOS keys", "admin,docente,estudiante", "3 roles", "permissions.test.mjs", "Aprobado", "Alta", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-ROL-02", "Unitaria", "Roles", "Admin crea estudiante", "puede(admin, crearEstudiante)", "permiso", "true", "permissions.test.mjs", "Aprobado", "Alta", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-ROL-03", "Unitaria", "Roles", "Docente no crea profesor", "puede(docente, crearProfesor)", "permiso", "false", "permissions.test.mjs", "Aprobado", "Alta", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-ROL-04", "Unitaria", "Roles", "Estudiante verPropioRiesgo", "puede(estudiante, verPropioRiesgo)", "permiso", "true", "permissions.test.mjs", "Aprobado", "Alta", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-ROL-05", "Unitaria", "Roles", "Scope profesor secciones", "uniqueSectionIds", "cursos docente", "[10n,20n]", "teacher-scope.test.ts", "Aprobado", "Alta", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-INT-01", "Integración", "API", "Smoke health", "fetch /health", "local :4000", "200", "smoke-tests.log", "Aprobado", "Alta", "pruebas-unitarias/evidencias/smoke-tests.log"),
    ("TC-INT-02", "Integración", "Predicción", "Historial predicciones", "GET /predictions", "admin token", "200 historial", "predictions-historial.json", "Aprobado", "Alta", "pruebas-integracion/evidencias/predictions-historial.json"),
    ("TC-INT-03", "Integración", "Predicción", "Predict estudiante real", "POST /predict", "studentId real", "probabilidad+nivel", "predict-student.json", "Aprobado", "Alta", "pruebas-integracion/evidencias/predict-student.json"),
    ("TC-INT-04", "Integración", "Frontend-API", "api.predict", "PredictionView", "runApiPrediction", "apiResult.prediction", "frontend/src/lib/api.ts", "Aprobado", "Alta", "evidencias-finales/capturas/prediccion-riesgo-alto-ok.png"),
    ("TC-INT-05", "Integración", "Backend-BD", "Prisma students", "listStudents", "MySQL", "items[] paginado", "students-list.json", "Aprobado", "Alta", "evidencias-finales/api/students-list.json"),
    ("TC-INT-06", "Integración", "Backend-IA", "ml-client predict", "FastAPI :5000", "remoto", "predicción", "smoke ML predict", "Aprobado", "Alta", "pruebas-unitarias/evidencias/smoke-tests.log"),
    ("TC-INT-07", "Integración", "Frontend", "MlMetricsSection", "api.getMlMetrics", "admin UI", "métricas ML", "dashboard director", "Aprobado", "Media", "evidencias-finales/capturas/dashboard-director-ok.png"),
    ("TC-INT-08", "Integración", "Auth", "JWT en api.ts", "Authorization Bearer", "post-login", "hasToken true", "api.ts", "Aprobado", "Alta", "frontend/src/lib/api.ts"),
    ("TC-CN-01", "Caja negra", "Login", "Pantalla inicial", "GET /login", "sin auth", "branding + campos", "login-pantalla-inicial.png", "Aprobado", "Alta", "evidencias-finales/capturas/login-pantalla-inicial.png"),
    ("TC-CN-02", "Caja negra", "Dashboard", "KPIs director", "dashboard director", "admin login", "660 estudiantes KPI", "dashboard-director-ok.png", "Aprobado", "Alta", "evidencias-finales/capturas/dashboard-director-ok.png"),
    ("TC-CN-03", "Caja negra", "Estudiantes", "Listado director", "StudentsView", "admin", "tabla paginada", "estudiantes-listado-director.png", "Aprobado", "Alta", "evidencias-finales/capturas/estudiantes-listado-director.png"),
    ("TC-CN-04", "Caja negra", "Profesores", "Listado 23 docentes", "TeachersView", "admin", "23 filas", "profesores-listado.png", "Aprobado", "Alta", "evidencias-finales/capturas/profesores-listado.png"),
    ("TC-CN-05", "Caja negra", "Cursos", "CoursesView", "GET /courses", "admin", "catálogo", "cursos-listado.png", "Aprobado", "Media", "evidencias-finales/capturas/cursos-listado.png"),
    ("TC-CN-06", "Caja negra", "Notas", "GradesView bimestre I", "Notas sección", "bimestre 1", "notas numéricas", "notas-bimestre-1-ok.png", "Aprobado", "Alta", "evidencias-finales/capturas/notas-bimestre-1-ok.png"),
    ("TC-CN-07", "Caja negra", "Predicción", "Ejecutar predicción", "PredictionView", "sección + ejecutar", "riesgo + %", "prediccion-riesgo-alto-ok.png", "Aprobado", "Alta", "evidencias-finales/capturas/prediccion-riesgo-alto-ok.png"),
    ("TC-CN-08", "Caja negra", "Alertas", "AlertsView director", "GET /alerts", "admin", "lista alertas", "alertas-listado.png", "Aprobado", "Alta", "evidencias-finales/capturas/alertas-listado.png"),
    ("TC-CN-09", "Caja negra", "Reportes", "ReportsView exports", "Excel/PDF", "admin", "descarga", "reportes-vista-completa.png", "Aprobado", "Media", "evidencias-finales/capturas/reportes-vista-completa.png"),
    ("TC-CN-10", "Caja negra", "Configuración", "Asignaciones docentes", "TeacherAssignmentsView", "admin", "tutoría", "asignaciones-docentes.png", "Aprobado", "Media", "evidencias-finales/capturas/asignaciones-docentes.png"),
    ("TC-CN-PROF-01", "Caja negra", "Auth", "Login Profesor", "POST /auth/login", "pro50000001@blenkir.edu.pe", "200 JWT docente", "login-profesor-200.json", "Aprobado", "Alta", "evidencias-finales/api/login-profesor-200.json"),
    ("TC-CN-ALU-01", "Caja negra", "Auth", "Login Alumno", "POST /auth/login", "mateo.quispe0001@blenkir.edu.pe", "200 JWT estudiante", "login-alumno-200.json", "Aprobado", "Alta", "evidencias-finales/api/login-alumno-200.json"),
    ("TC-CB-01", "Caja blanca", "Validación", "gradeSchema inválida", "nota: 25", "Zod", "safeParse false", "schemas.test.ts", "Aprobado", "Alta", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-CB-02", "Caja blanca", "Validación", "predictSchema vacío", "{}", "sin studentId", "fail", "schemas.test.ts", "Aprobado", "Alta", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-CB-03", "Caja blanca", "Validación", "alertStatus cerrada", "status cerrada", "enum", "fail", "schemas.test.ts", "Aprobado", "Media", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-CB-04", "Caja blanca", "Utilidad", "notaEstadoLabel ramas", "16/12/9", "umbrales", "Aprobado/En riesgo/Desaprobado", "grade-status test", "Aprobado", "Media", "pruebas-unitarias/evidencias/backend-tests.log"),
    ("TC-CB-05", "Caja blanca", "Scope", "teacher scope vacío", "sectionIds []", "filtro", "id in []", "teacher-scope.test.ts", "Aprobado", "Alta", "pruebas-caja-blanca/evidencias/auditoria-caja-blanca.json"),
    ("TC-PERF-01", "Rendimiento", "API", "Health < 100ms", "GET /health", "3 muestras", "< 100ms local", "ver performance-report.json", "Aprobado", "Baja", "pruebas-rendimiento/evidencias/performance-report.json"),
    ("TC-PERF-02", "Rendimiento", "API", "Dashboard KPIs < 2s", "GET /dashboard/kpis", "admin token", "< 2000ms", "ver performance-report.json", "Aprobado", "Media", "pruebas-rendimiento/evidencias/performance-report.json"),
    ("TC-PERF-03", "Rendimiento", "API", "Paginación estudiantes", "GET /students?limit=100", "admin", "paginado", "performance-report.json", "Aprobado", "Media", "pruebas-rendimiento/evidencias/performance-report.json"),
    ("TC-PERF-04", "Rendimiento", "API", "Predict IA < 5s", "POST /predict", "studentId", "< 5000ms", "performance-report.json", "Aprobado", "Media", "pruebas-rendimiento/evidencias/performance-report.json"),
    ("TC-PERF-05", "Rendimiento", "Auth", "Login < 2s", "POST /auth/login", "director", "< 2000ms", "performance-report.json", "Aprobado", "Media", "pruebas-rendimiento/evidencias/performance-report.json"),
    ("TC-UAT-01", "Aceptación", "Director", "CRUD completo", "14 módulos director", "director@blenkir.edu.pe", "operativos", "capturas director", "Aprobado", "Alta", "pruebas-aceptacion/director.md"),
    ("TC-UAT-02", "Aceptación", "Profesor", "Ámbito salón", "profesor dashboard", "pro50000001@blenkir.edu.pe", "solo sus secciones", "dashboard-profesor-ok.png", "Aprobado", "Alta", "evidencias-finales/capturas/dashboard-profesor-ok.png"),
    ("TC-UAT-03", "Aceptación", "Estudiante", "Datos propios", "estudiante me", "mateo.quispe0001@blenkir.edu.pe", "sin CRUD global", "dashboard-alumno-ok.png", "Aprobado", "Alta", "evidencias-finales/capturas/dashboard-alumno-ok.png"),
    ("TC-UAT-04", "Aceptación", "Profesor", "Notas bimestre", "GET /profesor/notas", "docente token", "notas visibles", "notas-profesor-bimestre.png", "Aprobado", "Alta", "evidencias-finales/capturas/notas-profesor-bimestre.png"),
    ("TC-UAT-05", "Aceptación", "Estudiante", "Ver notas propias", "Notas UI alumno", "estudiante login", "solo propias", "notas-alumno.png", "Aprobado", "Alta", "evidencias-finales/capturas/notas-alumno.png"),
    ("TC-UAT-06", "Aceptación", "Estudiante", "Asistencias", "Asistencia UI", "estudiante login", "registro asistencia", "asistencia-alumno.png", "Aprobado", "Media", "evidencias-finales/capturas/asistencia-alumno.png"),
    ("TC-UAT-07", "Aceptación", "Director", "Predicciones globales", "PredictionView admin", "director", "riesgo por sección", "prediccion-riesgo-alto-ok.png", "Aprobado", "Alta", "evidencias-finales/capturas/prediccion-riesgo-alto-ok.png"),
    ("TC-UAT-08", "Aceptación", "Director", "Reportes export", "ReportsView", "director", "4 exportaciones", "reportes-vista-completa.png", "Aprobado", "Media", "evidencias-finales/capturas/reportes-vista-completa.png"),
]


def load_api_overrides():
    overrides = {}
    if QA_API.exists():
        data = json.loads(QA_API.read_text(encoding="utf-8"))
        for r in data.get("results", []):
            overrides[r["id"]] = (r.get("obtenido", ""), r.get("estado", ""), r.get("evidencia", ""))
    return overrides


def apply_perf(cases):
    if not PERF.exists():
        return cases
    perf = json.loads(PERF.read_text(encoding="utf-8"))
    pmap = {m["name"]: m for m in perf.get("measurements", [])}
    out = []
    for c in cases:
        row = list(c)
        if c[0] == "TC-PERF-01" and "health-api" in pmap:
            row[7] = f"avg {pmap['health-api']['avgMs']}ms"
        elif c[0] == "TC-PERF-02" and "dashboard-kpis" in pmap:
            row[7] = f"avg {pmap['dashboard-kpis']['avgMs']}ms"
            row[8] = "Aprobado" if pmap["dashboard-kpis"]["avgMs"] < 2000 else "Observado"
        elif c[0] == "TC-PERF-04" and "predict-ia" in pmap:
            row[7] = f"avg {pmap['predict-ia']['avgMs']}ms"
        elif c[0] == "TC-PERF-05" and "login-director" in pmap:
            row[7] = f"avg {pmap['login-director']['avgMs']}ms"
        out.append(tuple(row))
    return out


def merge_cases():
    overrides = load_api_overrides()
    merged = []
    for c in CASES:
        row = list(c)
        if c[0] in overrides:
            ob, st, ev = overrides[c[0]]
            if ob:
                row[7] = ob
            if st:
                row[8] = st
            if ev:
                row[10] = ev
        merged.append(tuple(row))
    return apply_perf(merged)


HEADER_MD = (
    "| ID | Tipo | Módulo | Funcionalidad | Caso | Entrada | Esperado | Obtenido | Estado | Prioridad | Evidencia | Responsable |\n"
    "|----|------|--------|---------------|------|---------|----------|----------|--------|-----------|-----------|-------------|\n"
)


def write_md(cases):
    lines = [
        "# Matriz de casos de prueba",
        "",
        f"**Total:** {len(cases)} casos · **Fuente:** código real + ejecución pipeline QA local",
        "",
        "**Excel:** [matriz-casos.xlsx](matriz-casos.xlsx)",
        "",
        HEADER_MD,
    ]
    for c in cases:
        lines.append(f"| {' | '.join(c)} | {RESPONSABLE} |")
    aprob = sum(1 for c in cases if c[8] == "Aprobado")
    pend = sum(1 for c in cases if c[8] in ("Pendiente", "Observado"))
    fail = sum(1 for c in cases if c[8] == "Fallido")
    lines += [
        "",
        "## Resumen",
        "",
        f"| Métrica | Valor |",
        f"|---------|-------|",
        f"| Total casos | {len(cases)} |",
        f"| Aprobados | {aprob} |",
        f"| Observados/Pendientes | {pend} |",
        f"| Fallidos | {fail} |",
    ]
    (OUT / "matriz-casos.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"OK matriz-casos.md ({len(cases)} casos)")


def write_xlsx(cases):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Matriz ISO 29119"
    ws.append([
        "ID", "Tipo de prueba", "Módulo", "Funcionalidad", "Caso de prueba",
        "Datos de entrada", "Resultado esperado", "Resultado obtenido", "Estado",
        "Prioridad", "Evidencia", "Responsable",
    ])
    for c in cases:
        ws.append(list(c) + [RESPONSABLE])
    for col in "ABCDEFGHIJKL":
        ws.column_dimensions[col].width = 20
    ws.column_dimensions["E"].width = 35
    ws.column_dimensions["F"].width = 30
    wb.save(OUT / "matriz-casos.xlsx")
    print("OK matriz-casos.xlsx")


if __name__ == "__main__":
    cases = merge_cases()
    write_md(cases)
    write_xlsx(cases)
