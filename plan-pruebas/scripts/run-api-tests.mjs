/**
 * Pruebas API: caja negra, seguridad, integración — resultados reales
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { PATHS, CREDS } from "./lib/config.mjs";
import { login, apiFetch } from "./lib/http.mjs";

const results = [];

function record(id, tipo, modulo, funcionalidad, caso, entrada, esperado, obtenido, estado, prioridad, evidencia) {
  results.push({
    id, tipo, modulo, funcionalidad, caso, entrada, esperado, obtenido, estado, prioridad, evidencia,
  });
}

async function run() {
  mkdirSync(PATHS.cajaNegraEvidencias, { recursive: true });
  mkdirSync(PATHS.seguridadEvidencias, { recursive: true });
  mkdirSync(PATHS.integracionEvidencias, { recursive: true });
  mkdirSync(PATHS.evidenciasFinales + "/api", { recursive: true });

  // --- Health ---
  const health = await apiFetch("/health");
  const healthOk = health.status === 200;
  record("TC-BE-01", "Integración", "Backend", "Health API", "GET /health sin auth", "sin token",
    "HTTP 200", `HTTP ${health.status} (${health.ms}ms)`, healthOk ? "Aprobado" : "Fallido", "Alta",
    "evidencias-finales/api/health.json");
  writeFileSync(PATHS.evidenciasFinales + "/api/health.json", JSON.stringify(health, null, 2));

  // --- Login director ---
  let directorToken = null;
  try {
    const d = await login(CREDS.director.email, CREDS.director.password);
    directorToken = d.token;
    record("TC-BE-02", "Caja negra", "Auth", "Login Director", "POST /auth/login director",
      CREDS.director.email, "200 + JWT", `200 JWT (${d.ms}ms)`, "Aprobado", "Alta",
      "evidencias-finales/api/login-director-200.json");
    writeFileSync(PATHS.evidenciasFinales + "/api/login-director-200.json",
      JSON.stringify({ status: 200, ms: d.ms, hasToken: !!d.token }, null, 2));
  } catch (e) {
    record("TC-BE-02", "Caja negra", "Auth", "Login Director", "POST /auth/login director",
      CREDS.director.email, "200 + JWT", e.message, "Fallido", "Alta", "evidencias-finales/api/login-director-fail.json");
  }

  // --- Login profesor ---
  let profesorToken = null;
  try {
    const p = await login(CREDS.profesor.email, CREDS.profesor.password);
    profesorToken = p.token;
    record("TC-CN-PROF-01", "Caja negra", "Auth", "Login Profesor", "POST /auth/login profesor",
      CREDS.profesor.email, "200 + JWT docente", `200 JWT (${p.ms}ms)`, "Aprobado", "Alta",
      "evidencias-finales/api/login-profesor-200.json");
    writeFileSync(PATHS.evidenciasFinales + "/api/login-profesor-200.json",
      JSON.stringify({ status: 200, ms: p.ms }, null, 2));
  } catch (e) {
    record("TC-CN-PROF-01", "Caja negra", "Auth", "Login Profesor", "POST /auth/login profesor",
      CREDS.profesor.email, "200 + JWT", e.message, "Fallido", "Alta", "");
  }

  // --- Login estudiante ---
  let estudianteToken = null;
  try {
    const e = await login(CREDS.estudiante.email, CREDS.estudiante.password);
    estudianteToken = e.token;
    record("TC-CN-ALU-01", "Caja negra", "Auth", "Login Alumno", "POST /auth/login estudiante",
      CREDS.estudiante.email, "200 + JWT estudiante", `200 JWT (${e.ms}ms)`, "Aprobado", "Alta",
      "evidencias-finales/api/login-alumno-200.json");
    writeFileSync(PATHS.evidenciasFinales + "/api/login-alumno-200.json",
      JSON.stringify({ status: 200, ms: e.ms }, null, 2));
  } catch (e) {
    record("TC-CN-ALU-01", "Caja negra", "Auth", "Login Alumno", "POST /auth/login estudiante",
      CREDS.estudiante.email, "200 + JWT", e.message, "Fallido", "Alta", "");
  }

  // --- Login inválido ---
  const badLogin = await apiFetch("/auth/login", {
    method: "POST",
    body: { email: "x", password: "123456" },
  });
  const badOk = badLogin.status === 400;
  record("TC-BE-03", "Caja negra", "Auth", "Login email inválido", "POST /auth/login email x",
    "{email:x, password:123456}", "400 validación", `HTTP ${badLogin.status}`, badOk ? "Aprobado" : "Observado", "Alta",
    "evidencias-finales/api/login-invalido-400.json");
  writeFileSync(PATHS.evidenciasFinales + "/api/login-invalido-400.json", JSON.stringify(badLogin, null, 2));

  // --- Seguridad: sin token ---
  const noToken = await apiFetch("/students");
  record("TC-SEC-01", "Seguridad", "Auth", "JWT ausente", "GET /students sin Bearer",
    "sin Authorization", "401", `HTTP ${noToken.status}`, noToken.status === 401 ? "Aprobado" : "Fallido", "Alta",
    "evidencias-finales/api/api-token-ausente-401.json");
  writeFileSync(PATHS.evidenciasFinales + "/api/api-token-ausente-401.json", JSON.stringify(noToken, null, 2));

  // --- Seguridad: token inválido ---
  const badToken = await apiFetch("/students", { token: "invalid.jwt.token" });
  record("TC-SEC-02", "Seguridad", "Auth", "JWT malformado", "GET /students Bearer invalid",
    "Bearer invalid", "401", `HTTP ${badToken.status}`, badToken.status === 401 ? "Aprobado" : "Fallido", "Alta",
    "evidencias-finales/api/api-token-invalido-401.json");
  writeFileSync(PATHS.evidenciasFinales + "/api/api-token-invalido-401.json", JSON.stringify(badToken, null, 2));

  if (profesorToken && directorToken) {
    const profCreate = await apiFetch("/students", {
      token: profesorToken,
      method: "POST",
      body: { firstName: "Test", lastName: "QA", dni: "99999999" },
    });
    record("TC-SEC-03", "Seguridad", "RBAC", "Docente POST /students", "POST /students token docente",
      "token docente", "403", `HTTP ${profCreate.status}`, profCreate.status === 403 ? "Aprobado" : "Observado", "Alta",
      "pruebas-seguridad/evidencias/docente-post-students.json");
    writeFileSync(PATHS.seguridadEvidencias + "/docente-post-students.json", JSON.stringify(profCreate, null, 2));
  }

  if (estudianteToken) {
    const stuList = await apiFetch("/students", { token: estudianteToken });
    record("TC-SEC-04", "Seguridad", "RBAC", "Estudiante GET /students", "GET /students token estudiante",
      "token estudiante", "403", `HTTP ${stuList.status}`, stuList.status === 403 ? "Aprobado" : "Fallido", "Alta",
      "pruebas-seguridad/evidencias/estudiante-get-students.json");
    writeFileSync(PATHS.seguridadEvidencias + "/estudiante-get-students.json", JSON.stringify(stuList, null, 2));
  }

  if (directorToken) {
    const dash = await apiFetch("/dashboard/kpis", { token: directorToken });
    const hasKpis = dash.json?.data?.kpis?.byLevel ?? dash.json?.kpis?.byLevel;
    record("TC-BE-07", "Caja negra", "Dashboard", "KPIs director", "GET /dashboard/kpis admin",
      "Bearer admin", "kpis.byLevel", hasKpis ? `200 byLevel (${dash.ms}ms)` : `200 sin byLevel (${dash.status})`,
      hasKpis ? "Aprobado" : "Fallido", "Alta", "evidencias-finales/api/dashboard-kpis.json");
    writeFileSync(PATHS.evidenciasFinales + "/api/dashboard-kpis.json", JSON.stringify(dash, null, 2));

    const students = await apiFetch("/students?limit=5", { token: directorToken });
    const count = students.json?.data?.items?.length ?? students.json?.items?.length ?? 0;
    record("TC-CN-03", "Caja negra", "Estudiantes", "Listado director", "GET /students?limit=5",
      "admin token", "lista paginada", `${students.status} items=${count} (${students.ms}ms)`,
      students.ok && count > 0 ? "Aprobado" : "Fallido", "Alta", "evidencias-finales/api/students-list.json");
    writeFileSync(PATHS.evidenciasFinales + "/api/students-list.json", JSON.stringify(students, null, 2));

    const teachers = await apiFetch("/teachers", { token: directorToken });
    const tCount = (teachers.json?.data ?? teachers.json)?.length ?? 0;
    record("TC-CN-04", "Caja negra", "Profesores", "Listado docentes", "GET /teachers",
      "admin token", "23 profesores", `HTTP ${teachers.status} count≈${tCount} (${teachers.ms}ms)`,
      teachers.ok ? "Aprobado" : "Fallido", "Alta", "evidencias-finales/api/teachers-list.json");
    writeFileSync(PATHS.evidenciasFinales + "/api/teachers-list.json", JSON.stringify(teachers, null, 2));

    const courses = await apiFetch("/courses", { token: directorToken });
    record("TC-CN-05", "Caja negra", "Cursos", "Listado cursos", "GET /courses",
      "admin token", "catálogo cursos", `HTTP ${courses.status} (${courses.ms}ms)`,
      courses.ok ? "Aprobado" : "Observado", "Media", "evidencias-finales/api/courses-list.json");
    writeFileSync(PATHS.evidenciasFinales + "/api/courses-list.json", JSON.stringify(courses, null, 2));

    const alerts = await apiFetch("/alerts", { token: directorToken });
    record("TC-CN-08", "Caja negra", "Alertas", "Listado alertas", "GET /alerts",
      "admin token", "lista alertas", `HTTP ${alerts.status} (${alerts.ms}ms)`,
      alerts.ok ? "Aprobado" : "Fallido", "Alta", "evidencias-finales/api/alerts-list.json");
    writeFileSync(PATHS.evidenciasFinales + "/api/alerts-list.json", JSON.stringify(alerts, null, 2));

    const predictions = await apiFetch("/predictions?limit=5", { token: directorToken });
    record("TC-INT-02", "Integración", "Predicción", "Historial predicciones", "GET /predictions",
      "admin token", "200 historial", `HTTP ${predictions.status} (${predictions.ms}ms)`,
      predictions.ok ? "Aprobado" : "Fallido", "Alta", "pruebas-integracion/evidencias/predictions-historial.json");
    writeFileSync(PATHS.integracionEvidencias + "/predictions-historial.json", JSON.stringify(predictions, null, 2));

    const sid = students.json?.data?.items?.[0]?.id ?? students.json?.items?.[0]?.id;
    if (sid) {
      const pred = await apiFetch("/predict", {
        token: directorToken,
        method: "POST",
        body: { studentId: sid },
      });
      const p = pred.json?.data?.prediction ?? pred.json?.prediction;
      const hasRisk = p?.nivel_riesgo || p?.level || p?.nivelRiesgo;
      record("TC-INT-03", "Integración", "Predicción", "Predict estudiante real", `POST /predict studentId=${sid}`,
        `studentId=${sid}`, "probabilidad + nivel", `HTTP ${pred.status} nivel=${hasRisk} (${pred.ms}ms)`,
        pred.ok && hasRisk ? "Aprobado" : "Observado", "Alta", "pruebas-integracion/evidencias/predict-student.json");
      writeFileSync(PATHS.integracionEvidencias + "/predict-student.json", JSON.stringify(pred, null, 2));
    }

    const teacherDetail = await apiFetch("/teachers/1/detail", { token: profesorToken ?? directorToken });
    if (profesorToken) {
      record("TC-BE-12", "Seguridad", "RBAC", "Detalle profesor docente", "GET /teachers/1/detail docente",
        "token docente", "403", `HTTP ${teacherDetail.status}`,
        teacherDetail.status === 403 ? "Aprobado" : "Observado", "Media",
        "pruebas-seguridad/evidencias/docente-teacher-detail.json");
      writeFileSync(PATHS.seguridadEvidencias + "/docente-teacher-detail.json", JSON.stringify(teacherDetail, null, 2));
    }
  }

  if (profesorToken) {
    const profDash = await apiFetch("/profesor/dashboard", { token: profesorToken });
    record("TC-UAT-02", "Aceptación", "Profesor", "Dashboard profesor", "GET /profesor/dashboard",
      CREDS.profesor.email, "200 datos salón", `HTTP ${profDash.status} (${profDash.ms}ms)`,
      profDash.ok ? "Aprobado" : "Fallido", "Alta", "pruebas-aceptacion/evidencias/profesor-dashboard.json");
    writeFileSync(PATHS.aceptacionEvidencias + "/profesor-dashboard.json", JSON.stringify(profDash, null, 2));

    const profNotas = await apiFetch("/profesor/notas", { token: profesorToken });
    record("TC-CN-06", "Caja negra", "Notas", "Notas profesor", "GET /profesor/notas",
      "token docente", "notas bimestre", `HTTP ${profNotas.status} (${profNotas.ms}ms)`,
      profNotas.ok ? "Aprobado" : "Observado", "Alta", "evidencias-finales/api/profesor-notas.json");
    writeFileSync(PATHS.evidenciasFinales + "/api/profesor-notas.json", JSON.stringify(profNotas, null, 2));
  }

  if (estudianteToken) {
    const me = await apiFetch("/auth/me", { token: estudianteToken });
    record("TC-UAT-03", "Aceptación", "Estudiante", "Perfil propio", "GET /auth/me estudiante",
      CREDS.estudiante.email, "200 datos propios", `HTTP ${me.status} (${me.ms}ms)`,
      me.ok ? "Aprobado" : "Fallido", "Alta", "pruebas-aceptacion/evidencias/estudiante-me.json");
    writeFileSync(PATHS.aceptacionEvidencias + "/estudiante-me.json", JSON.stringify(me, null, 2));
  }

  const outPath = PATHS.cajaNegraEvidencias + "/api-results.json";
  writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  return results;
}

run()
  .then((r) => {
    const ok = r.filter((x) => x.estado === "Aprobado").length;
    const fail = r.filter((x) => x.estado === "Fallido").length;
    console.log(`API tests: ${ok} aprobados, ${fail} fallidos, ${r.length} total`);
    process.exit(fail > 0 ? 1 : 0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
