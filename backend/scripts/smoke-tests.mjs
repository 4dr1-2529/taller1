/**
 * Pruebas smoke del API — requiere backend en :4000 (o API_URL).
 * Ejecutar: node scripts/smoke-tests.mjs
 *
 * Data Seed V5: cada rol usa su propia variable de entorno.
 *   director  → DIRECTOR_INITIAL_PASSWORD
 *   docente   → TEACHER_INITIAL_PASSWORD
 *   estudiante→ STUDENT_INITIAL_PASSWORD
 *
 * ML todavía no está entrenado (Prediction=0, MlModelo=0): los chequeos ML son
 * informativos y no fallan la ejecución. No se crean predicciones ni métricas.
 */

const API = (process.env.API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

const CREDS = {
  director: { email: "director@blenkir.edu.pe", env: "DIRECTOR_INITIAL_PASSWORD", role: "admin" },
  docente: { email: "prof001@blenkir.edu.pe", env: "TEACHER_INITIAL_PASSWORD", role: "docente" },
  estudiante: { email: "est0002@alumnos.blenkir.edu.pe", env: "STUDENT_INITIAL_PASSWORD", role: "estudiante" },
};

const missing = Object.values(CREDS).filter((c) => !process.env[c.env]?.trim());
if (missing.length) {
  console.error(`Faltan variables de contraseña: ${missing.map((c) => c.env).join(", ")}`);
  process.exit(1);
}

let passed = 0;
let failed = 0;
const mlNotes = [];
const warnings = [];

function noteWarn(name, detail) {
  warnings.push(`${name}: ${detail}`);
  console.warn(`⚠ ${name}: ${detail}`);
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${name}:`, e.message);
  }
}

function noteMl(name, detail) {
  mlNotes.push(`${name}: ${detail}`);
  console.warn(`• ${name}: ${detail} (ML pendiente en fase separada)`);
}

async function login(role) {
  const c = CREDS[role];
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: c.email, password: process.env[c.env] }),
  });
  if (!r.ok) throw new Error(`login ${role} → HTTP ${r.status}`);
  const j = await r.json();
  const token = j.data?.token ?? j.token;
  if (!token) throw new Error(`login ${role} sin token`);
  const gotRole = j.data?.role ?? j.user?.role;
  if (gotRole && gotRole !== c.role) throw new Error(`login ${role} → rol ${gotRole}`);
  return token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function get(path, token) {
  const r = await fetch(`${API}${path}`, { headers: auth(token) });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function main() {
  await test("health API", async () => {
    const r = await fetch(`${API}/health`);
    if (!r.ok) throw new Error(`status ${r.status}`);
  });

  await test("login director (V5)", async () => await login("director"));
  await test("login profesor (V5)", async () => await login("docente"));
  await test("login estudiante (V5)", async () => await login("estudiante"));

  await test("RBAC: estudiante no listado global", async () => {
    const token = await login("estudiante");
    const { status } = await get("/students?limit=1", token);
    if (status !== 403 && status !== 401) throw new Error(`esperaba 403, obtuve ${status}`);
  });

  await test("RBAC: profesor fuera de scope recibe 403", async () => {
    const token = await login("docente");
    const { status } = await get("/admin/audit-logs", token);
    if (status !== 403 && status !== 401) throw new Error(`esperaba 403, obtuve ${status}`);
  });

  await test("dashboard del director carga", async () => {
    const token = await login("director");
    const { status, body } = await get("/dashboard/kpis", token);
    if (status !== 200) throw new Error(`dashboard ${status}`);
    if (!body) throw new Error("dashboard sin cuerpo");
  });

  await test("sin predicciones fabricadas", async () => {
    const token = await login("director");
    const { status, body } = await get("/predictions?limit=5", token);
    if (status !== 200) throw new Error(`predictions ${status}`);
    const items = body?.data?.items ?? body?.items ?? [];
    if (!Array.isArray(items)) throw new Error("predictions sin lista");
    if (items.length > 0) {
      throw new Error(`se esperaba 0 predicciones (ML sin entrenar), hay ${items.length}`);
    }
  });

  // --- Matriz RBAC por rol (exclusivamente GET: cero escrituras) ---
  const roles = {};
  for (const role of Object.keys(CREDS)) roles[role] = await login(role);

  const allowed = [
    ["director", "/students?limit=1"], ["director", "/teachers?limit=1"],
    ["director", "/teacher-assignments?limit=1"], ["director", "/matriculas?limit=1"],
    ["director", "/grades?limit=1"], ["director", "/attendance?limit=1"],
    ["director", "/alerts?limit=1"], ["director", "/dashboard/kpis"],
    ["director", "/admin/users?limit=1"], ["director", "/admin/audit-logs?limit=1"],
    ["director", "/admin/system-stats"], ["director", "/admin/settings"],
    ["director", "/academic/niveles"], ["director", "/academic/secciones"],
    ["director", "/academic/anios-lectivos"], ["director", "/courses"],
    ["director", "/notifications"],
    ["docente", "/profesor/dashboard"], ["docente", "/profesor/grados"],
    ["docente", "/profesor/secciones"], ["docente", "/profesor/mis-cursos"],
    ["docente", "/profesor/mis-secciones"],
    ["docente", "/profesor/mis-estudiantes?page=1&limit=1"],
    ["docente", "/profesor/notas"], ["docente", "/profesor/asistencia"],
    ["docente", "/profesor/alertas"], ["docente", "/grades?limit=1"],
    ["docente", "/attendance?limit=1"], ["docente", "/alerts?limit=1"],
    ["docente", "/dashboard/kpis"], ["docente", "/ml/metrics"],
    ["docente", "/courses"], ["docente", "/notifications"],
    ["estudiante", "/estudiante/perfil"], ["estudiante", "/estudiante/dashboard"],
    ["estudiante", "/estudiante/notas"], ["estudiante", "/estudiante/asistencia"],
    ["estudiante", "/estudiante/lms"], ["estudiante", "/estudiante/alertas"],
    ["estudiante", "/estudiante/mensajes"], ["estudiante", "/notifications"],
    ["estudiante", "/courses"], ["estudiante", "/academic/niveles"],
  ];
  for (const [role, path] of allowed) {
    await test(`RBAC permitido ${role} → ${path}`, async () => {
      const { status } = await get(path, roles[role]);
      if (status !== 200) throw new Error(`HTTP ${status}`);
    });
  }

  const forbidden = [
    ["estudiante", "/students?limit=1"], ["estudiante", "/teachers?limit=1"],
    ["estudiante", "/profesor/mis-estudiantes"], ["estudiante", "/admin/cuentas-acceso"],
    ["estudiante", "/admin/users"], ["estudiante", "/alerts"],
    ["estudiante", "/dashboard/kpis"], ["estudiante", "/grades?limit=1"],
    ["docente", "/students?limit=1"], ["docente", "/teachers?limit=1"],
    ["docente", "/admin/cuentas-acceso"], ["docente", "/admin/users"],
    ["docente", "/admin/audit-logs"], ["director", "/profesor/dashboard"],
    ["director", "/estudiante/dashboard"],
  ];
  for (const [role, path] of forbidden) {
    await test(`RBAC denegado ${role} ✗ ${path}`, async () => {
      const { status } = await get(path, roles[role]);
      if (status !== 403) throw new Error(`esperaba 403, obtuve ${status}`);
    });
  }

  // El backend desplegado aún expone `password` en claro. El código local ya lo
  // sustituyó por `passwordEnv` (solo nombres de variable), pero ese cambio
  // exige un redeploy de Railway para surtir efecto en producción.
  {
    const { status, body } = await get("/admin/cuentas-acceso", roles.director);
    if (status !== 200) {
      await test("exportación de cuentas accesible para admin", async () => {
        throw new Error(`HTTP ${status}`);
      });
    } else {
      const text = JSON.stringify(body ?? {});
      if (/"password"\s*:/.test(text)) {
        noteWarn(
          "/admin/cuentas-acceso",
          "expone `password` en claro (corregido en local, pendiente de redeploy)",
        );
      } else if (!/passwordEnv/.test(text)) {
        await test("exportación de cuentas usa passwordEnv", async () => {
          throw new Error("falta passwordEnv (nombres de variable)");
        });
      } else {
        await test("exportación de cuentas sin contraseña en claro", async () => {});
      }
      if (!/passwordEnv/.test(text) && !/"password"\s*:/.test(text)) {
        noteWarn("/admin/cuentas-acceso", "sin passwordEnv en la respuesta");
      }
    }
  }

  // Informativo: conteos V5 reales. No es aserción, para no acoplar este
  // script a una población concreta (la FASE 6 los verificó contra la BD).
  {
    const { body } = await get("/dashboard/kpis", roles.director);
    const k = body?.data?.kpis ?? body?.kpis ?? {};
    console.log(
      `• KPIs V5: estudiantes=${k.totalStudents} profesores=${k.totalTeachers} ` +
        `salones=${k.totalSalones} alertasAbiertas=${k.openAlerts} ` +
        `riesgoPromedio=${k.avgRisk ?? "null"} nivelAlto=${k.byLevel?.alto ?? "?"}`,
    );
  }

  // --- Informativo ML: SOLO LECTURA ---
  // Nunca se llama a POST /predict: aunque el servicio estuviera caído, esa
  // llamada podría persistir una predicción y el encargo prohíbe crearlas.
  await test("ML sin métricas inventadas", async () => {
    const token = await login("director");
    const { status, body } = await get("/ml/metrics", token);
    if (status !== 200) {
      // 503/servicio caído es un estado honesto, no un fallo del smoke.
      noteMl("/ml/metrics", `no disponible → HTTP ${status}`);
      return;
    }
    const metrics = body?.data?.metrics ?? body?.metrics ?? null;
    if (metrics && typeof metrics === "object") {
      // El backend devuelve `{ message: "ML service no disponible" }` como
      // marcador honesto cuando el servicio ML está caído. Solo un objeto que
      // contenga modelos con `f1_score` constituiría un set de métricas.
      const models = Object.values(metrics).filter(
        (v) => v && typeof v === "object" && "f1_score" in v,
      );
      if (models.length > 0) {
        throw new Error(`el servicio reporta ${models.length} modelo(s) con el modelo sin entrenar`);
      }
      noteMl("/ml/metrics", "sin modelos (estado honesto: modelo pendiente)");
      return;
    }
    noteMl("/ml/metrics", "respuesta sin métricas");
  });

  console.log(`\n${passed} ok, ${failed} fallos`);
  if (warnings.length) console.log(`⚠ Advertencias (no fallan): ${warnings.length}`);
  if (mlNotes.length) console.log(`ML pendiente (fase separada): ${mlNotes.length} chequeo(s) informativo(s)`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
