/**
 * Genera capturas PNG de resultados QA locales (casos exitosos / fallidos / validaciones).
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { OUT_QA, OUT_CAP, OUT_LEGACY } from "./config.mjs";

function readSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml() {
  const files = {
    typeCheck: readSafe(path.join(OUT_QA, "qa-type-check.txt")),
    backend: readSafe(path.join(OUT_QA, "qa-test-backend.txt")),
    ml: readSafe(path.join(OUT_QA, "qa-ml-test.txt")),
    lint: readSafe(path.join(OUT_QA, "qa-lint-frontend.txt")),
    api: readSafe(path.join(OUT_QA, "api-respuestas-locales.txt")),
  };

  const pass = (txt) => /pass|passed|✓|OK|PASS/i.test(txt) && !/FAIL|failed|error/i.test(txt.slice(-500));
  const results = [
    { name: "Type-check monorepo", ok: pass(files.typeCheck), tail: files.typeCheck.slice(-800) },
    { name: "Tests backend (Jest)", ok: pass(files.backend), tail: files.backend.slice(-800) },
    { name: "Tests ML (pytest)", ok: pass(files.ml), tail: files.ml.slice(-800) },
    { name: "Lint frontend", ok: pass(files.lint), tail: files.lint.slice(-800) },
  ];

  const okRows = results.filter((r) => r.ok);
  const failRows = results.filter((r) => !r.ok);

  const card = (r, cls) => `
    <div class="card ${cls}">
      <h3>${r.name} — ${r.ok ? "PASS" : "FAIL"}</h3>
      <pre>${escapeHtml(r.tail || "(sin salida)")}</pre>
    </div>`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/>
  <title>QA Local — Blenkir</title>
  <style>
    body{font-family:Segoe UI,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:32px}
    h1{color:#f47c20;margin-bottom:8px} h2{margin-top:28px;color:#94a3b8}
    .card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;margin:12px 0}
    .ok{border-color:#22c55e}.fail{border-color:#ef4444}
    pre{font-size:11px;white-space:pre-wrap;max-height:220px;overflow:hidden;background:#0b1220;padding:12px;border-radius:8px}
    .meta{color:#64748b;font-size:13px}
  </style></head><body>
  <h1>Evidencias QA — ejecución local</h1>
  <p class="meta">Generado ${new Date().toISOString()} · MySQL + API :4000 + ML :5000</p>
  <h2>Casos exitosos (${okRows.length})</h2>
  ${okRows.map((r) => card(r, "ok")).join("") || "<p>Sin casos PASS registrados.</p>"}
  <h2>Casos fallidos (${failRows.length})</h2>
  ${failRows.map((r) => card(r, "fail")).join("") || "<p>Ningún caso FAIL — suite local en verde.</p>"}
  <h2>Validaciones API</h2>
  <div class="card ok"><pre>${escapeHtml(files.api.slice(0, 3500))}</pre></div>
  </body></html>`;
}

async function screenshotHtml(html, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: dest, fullPage: true });
  await browser.close();
  console.log("  OK", path.basename(dest));
}

async function main() {
  const html = buildHtml();
  const qaCap = path.join(OUT_CAP, "14-qa");
  fs.mkdirSync(qaCap, { recursive: true });

  await screenshotHtml(html, path.join(qaCap, "qa-casos-exitosos.png"));
  await screenshotHtml(html, path.join(OUT_QA, "qa-resumen-visual.png"));

  const legacy = path.join(OUT_LEGACY, "frontend");
  const legacyBackend = path.join(OUT_LEGACY, "backend");
  fs.mkdirSync(legacy, { recursive: true });
  fs.mkdirSync(legacyBackend, { recursive: true });
  fs.copyFileSync(path.join(qaCap, "qa-casos-exitosos.png"), path.join(legacy, "qa-casos-exitosos.png"));
  fs.copyFileSync(path.join(OUT_QA, "qa-resumen-visual.png"), path.join(OUT_LEGACY, "backend", "qa-resumen-visual.png"));

  console.log("Capturas QA generadas.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
