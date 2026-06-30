/**
 * Ejecuta pruebas QA locales y guarda salidas + capturas API.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { API_URL, OUT_QA, OUT_LEGACY, PASSWORD } from "./config.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function run(cmd, logFile) {
  ensureDir(path.dirname(logFile));
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    fs.writeFileSync(logFile, out, "utf8");
    console.log("  ✓", path.basename(logFile), "(OK)");
    return { ok: true, out };
  } catch (e) {
    const combined = (e.stdout || "") + "\n" + (e.stderr || "") + "\n" + String(e);
    fs.writeFileSync(logFile, combined, "utf8");
    console.log("  ✗", path.basename(logFile), "(FAIL)");
    return { ok: false, out: combined };
  }
}

async function apiChecks() {
  const lines = [];
  const tests = [
    { name: "health", url: "http://localhost:4000/health" },
    { name: "login-director", url: `${API_URL}/auth/login`, method: "POST", body: { email: "director@blenkir.edu.pe", password: PASSWORD() } },
    { name: "login-invalido", url: `${API_URL}/auth/login`, method: "POST", body: { email: "bad@blenkir.edu.pe", password: "wrong" }, expectFail: true },
  ];

  for (const t of tests) {
    try {
      const res = await fetch(t.url, {
        method: t.method || "GET",
        headers: t.body ? { "Content-Type": "application/json" } : {},
        body: t.body ? JSON.stringify(t.body) : undefined,
      });
      const text = await res.text();
      lines.push(`=== ${t.name} === HTTP ${res.status}\n${text.slice(0, 2000)}\n`);
      console.log(`  ✓ api-${t.name}.txt (${res.status})`);
    } catch (e) {
      lines.push(`=== ${t.name} === ERROR ${e}\n`);
    }
  }

  const dest = path.join(OUT_QA, "api-respuestas-locales.txt");
  fs.writeFileSync(dest, lines.join("\n"), "utf8");
  fs.copyFileSync(dest, path.join(OUT_LEGACY, "backend", "api-respuestas-locales.txt"));
}

async function main() {
  ensureDir(OUT_QA);
  ensureDir(path.join(OUT_LEGACY, "backend"));
  console.log("\n[14] Evidencias QA local");

  const results = {
    typeCheck: run("npm run type-check", path.join(OUT_QA, "qa-type-check.txt")),
    testBackend: run("npm run test:backend", path.join(OUT_QA, "qa-test-backend.txt")),
    mlTest: run("npm run ml:test", path.join(OUT_QA, "qa-ml-test.txt")),
    lint: run("npm run lint", path.join(OUT_QA, "qa-lint-frontend.txt")),
  };

  await apiChecks();

  const summary = `# Resumen QA local\n\nGenerado: ${new Date().toISOString()}\n\n| Prueba | Estado |\n|--------|--------|\n` +
    Object.entries(results)
      .map(([k, v]) => `| ${k} | ${v.ok ? "✅ PASS" : "❌ FAIL"} |`)
      .join("\n") +
    "\n";

  fs.writeFileSync(path.join(OUT_QA, "RESUMEN-QA.md"), summary, "utf8");
  console.log("\nQA completado →", OUT_QA);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
