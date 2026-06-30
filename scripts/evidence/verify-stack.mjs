/**
 * Verificación QA: backend, frontend, BD (vía API), ML.
 * Uso: node scripts/evidence/verify-stack.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CREDS, URLS } from "../../plan-pruebas/scripts/lib/config.mjs";
import { apiFetch, login } from "../../plan-pruebas/scripts/lib/http.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = join(ROOT, "plan-pruebas/evidencias-finales/resultados");

const results = [];
let ok = 0;
let fail = 0;

async function check(name, fn) {
  const entry = { name, status: "PASS", detail: "", at: new Date().toISOString() };
  try {
    entry.detail = await fn();
    ok++;
  } catch (e) {
    entry.status = "FAIL";
    entry.detail = e instanceof Error ? e.message : String(e);
    fail++;
  }
  results.push(entry);
  console.log(`${entry.status === "PASS" ? "✓" : "✗"} ${name}: ${entry.detail}`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  await check("Frontend HTTP", async () => {
    const r = await fetch(URLS.web, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`status ${r.status}`);
    return `GET ${URLS.web} → ${r.status}`;
  });

  await check("Backend health", async () => {
    const r = await fetch(`${URLS.api}/health`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`status ${r.status}`);
    const j = await r.json();
    return JSON.stringify(j);
  });

  await check("Base de datos (login director)", async () => {
    const { token } = await login(CREDS.director.email, CREDS.director.password);
    const students = await apiFetch("/students?limit=1", { token });
    if (!students.ok) throw new Error(`students ${students.status}`);
    return `JWT OK · students API ${students.status}`;
  });

  await check("IA / ML health", async () => {
    const r = await fetch(`${URLS.ml}/health`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`status ${r.status}`);
    return await r.text();
  });

  await check("IA / ML predict", async () => {
    const r = await fetch(`${URLS.ml}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promedio_general: 12,
        asistencia_general: 80,
        actividad_lms_prom: 55,
        tareas_ratio: 0.75,
        estado: "activo",
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`predict ${r.status}`);
    const j = await r.json();
    if (!j.level) throw new Error("sin level");
    return `level=${j.level} score=${j.score} model=${j.model_name}`;
  });

  const iaDir = join(ROOT, "plan-pruebas/evidencias-finales/ia");
  mkdirSync(iaDir, { recursive: true });
  try {
    const [healthRes, metricsRes] = await Promise.all([
      fetch(`${URLS.ml}/health`, { signal: AbortSignal.timeout(10000) }),
      fetch(`${URLS.ml}/metrics`, { signal: AbortSignal.timeout(10000) }),
    ]);
    if (healthRes.ok) {
      writeFileSync(join(iaDir, "health-ml.json"), JSON.stringify(await healthRes.json(), null, 2));
    }
    if (metricsRes.ok) {
      writeFileSync(join(iaDir, "metricas-ml.json"), JSON.stringify(await metricsRes.json(), null, 2));
    }
  } catch (err) {
    console.warn("Evidencias ML opcionales omitidas:", err instanceof Error ? err.message : err);
  }

  const summary = {
    executed_at: new Date().toISOString(),
    passed: ok,
    failed: fail,
    overall: fail === 0 ? "PASS" : "FAIL",
    checks: results,
  };

  const outPath = join(OUT_DIR, "verificacion-stack.json");
  writeFileSync(outPath, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`\nResumen: ${ok} OK, ${fail} FAIL → ${outPath}`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
