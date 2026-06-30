/**
 * Mediciones de rendimiento reales — tiempos API
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { PATHS, CREDS, URLS } from "./lib/config.mjs";
import { login, apiFetch } from "./lib/http.mjs";

mkdirSync(PATHS.rendimientoEvidencias, { recursive: true });
mkdirSync(PATHS.evidenciasFinales + "/rendimiento", { recursive: true });

const measurements = [];

async function measure(name, fn) {
  const samples = [];
  for (let i = 0; i < 3; i++) {
    const r = await fn();
    samples.push(r.ms ?? r);
  }
  const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  measurements.push({ name, samples, avgMs: avg, minMs: min, maxMs: max });
  console.log(`${name}: avg=${avg}ms min=${min} max=${max}`);
  return { name, avg, min, max };
}

async function main() {
  await measure("login-director", async () => {
    const d = await login(CREDS.director.email, CREDS.director.password);
    return { ms: d.ms };
  });

  let token;
  try {
    const d = await login(CREDS.director.email, CREDS.director.password);
    token = d.token;
  } catch {
    console.error("No se pudo autenticar para rendimiento");
  }

  if (token) {
    await measure("dashboard-kpis", async () => apiFetch("/dashboard/kpis", { token }));
    await measure("students-list-limit100", async () => apiFetch("/students?limit=100", { token }));
    await measure("predictions-historial", async () => apiFetch("/predictions?limit=10", { token }));

    const st = await apiFetch("/students?limit=1", { token });
    const sid = st.json?.data?.items?.[0]?.id ?? st.json?.items?.[0]?.id;
    if (sid) {
      await measure("predict-ia", async () =>
        apiFetch("/predict", { token, method: "POST", body: { studentId: sid } }));
    }

    await measure("teachers-list", async () => apiFetch("/teachers", { token }));
    await measure("alerts-list", async () => apiFetch("/alerts", { token }));
  }

  await measure("health-api", async () => apiFetch("/health"));
  await measure("ml-health", async () => {
    const t0 = performance.now();
    const r = await fetch(`${URLS.ml}/health`, { signal: AbortSignal.timeout(10000) });
    return { ms: Math.round(performance.now() - t0), status: r.status };
  });

  const report = { timestamp: new Date().toISOString(), measurements };
  writeFileSync(PATHS.rendimientoEvidencias + "/performance-report.json", JSON.stringify(report, null, 2));
  writeFileSync(PATHS.evidenciasFinales + "/rendimiento/performance-report.json", JSON.stringify(report, null, 2));

  const md = [
    "# Reporte de rendimiento (local)",
    "",
    `**Fecha:** ${report.timestamp}`,
    "",
    "| Endpoint | Promedio (ms) | Mín | Máx |",
    "|----------|---------------|-----|-----|",
    ...measurements.map((m) => `| ${m.name} | ${m.avgMs} | ${m.minMs} | ${m.maxMs} |`),
    "",
    "## Umbrales",
    "",
    "- Login: objetivo < 2000ms",
    "- Dashboard KPIs: objetivo < 2000ms",
    "- Predict IA: objetivo < 5000ms",
    "",
  ].join("\n");
  writeFileSync(PATHS.rendimientoEvidencias + "/reporte-rendimiento.md", md);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
