/**
 * Orquestador evidencias locales completas.
 * Requisitos: MySQL XAMPP, backend :4000, frontend :3029, ML :5000
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { OUT } from "./config.mjs";

const EVIDENCE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EVIDENCE_DIR, "../..");

function step(title, fn) {
  console.log(`\n========== ${title} ==========`);
  return fn();
}

function sh(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: "inherit", shell: true });
}

async function waitUrl(url, ms = 120_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timeout esperando ${url}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  step("Verificar BD local", () => sh("node scripts/evidence/check-db.mjs"));

  step("Entrenar ML (métricas reales)", () => sh("npm run ml:train"));

  console.log("\n========== Verificar servicios locales ==========");
  await waitUrl("http://localhost:4000/health");
  await waitUrl("http://localhost:5000/health");
  await waitUrl("http://localhost:3029/login");
  console.log("  ✓ API, ML y Frontend activos");

  step("Instalar Playwright (evidence)", () => {
    sh("npm install --prefix scripts/evidence");
    sh("npx --prefix scripts/evidence playwright install chromium");
  });

  step("Capturas UI Playwright", () => sh("node scripts/evidence/capture-ui.mjs"));

  step("Capturas complementarias", () => sh("node scripts/evidence/capture-supplement.mjs"));

  step("Gráficos ML", () => sh("python scripts/evidence/generate-ml-charts.py"));

  step("Diagrama ER", () => sh("python scripts/evidence/generate-er-diagram.py"));

  step("Diagramas arquitectura", () => sh("python scripts/evidence/generate-architecture-diagrams.py"));

  step("QA local", () => sh("node scripts/evidence/run-qa.mjs"));

  step("Capturas QA", () => sh("node scripts/evidence/capture-qa-screens.mjs"));

  step("Matriz ISO 25010", () => sh("node scripts/evidence/generate-iso-matrix.mjs"));

  const readme = `# Evidencias finales — ejecución local

## Entorno

- Frontend: http://localhost:3029
- Backend: http://localhost:4000/api/v1
- ML: http://localhost:5000
- MySQL: tesis_dashboard (660 estudiantes, 23 profesores)

## Carpetas

| Carpeta | Contenido |
|---------|-----------|
| capturas/ | Screenshots UI reales |
| diagramas/ | Duplicado diagramas PNG/SVG |
| arquitectura/ | Diagramas arquitectura |
| ia/ | Matriz confusión, ROC, feature importance |
| metricas/ | JSON métricas evaluación |
| base_datos/ | ER Blenkir |
| api/ | Flujo API |
| iso/ | Diagramas ISO 9001/25010/29119 |
| qa/ | Logs tests locales |

Ver \`iso/MATRIZ-ISO-25010.md\` para trazabilidad calidad.

Regenerar: \`node scripts/evidence/run-all.mjs\` (servicios locales activos)
`;
  fs.writeFileSync(path.join(OUT, "README.md"), readme, "utf8");
  console.log("\n✅ Evidencias generadas en docs/evidencias_finales/");
}

main().catch((e) => {
  console.error("\n❌ Fallo generación evidencias:", e.message);
  process.exit(1);
});
