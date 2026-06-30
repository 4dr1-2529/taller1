/**
 * Ejecuta pruebas unitarias reales y guarda logs en plan-pruebas/
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { PATHS } from "./lib/config.mjs";

mkdirSync(PATHS.unitEvidencias, { recursive: true });
mkdirSync(PATHS.evidenciasFinales + "/terminal", { recursive: true });
mkdirSync(PATHS.evidenciasFinales + "/backend", { recursive: true });
mkdirSync(PATHS.evidenciasFinales + "/ia", { recursive: true });

const results = [];

function runCmd(name, cmd, outFile) {
  const t0 = Date.now();
  let output = "";
  let exitCode = 0;
  try {
    output = execSync(cmd, {
      cwd: PATHS.root,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 300000,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
  } catch (e) {
    exitCode = e.status ?? 1;
    output = (e.stdout ?? "") + "\n" + (e.stderr ?? "");
  }
  const ms = Date.now() - t0;
  writeFileSync(outFile, output);
  const pass = exitCode === 0;
  const match = output.match(/(\d+)\s+passed|(\d+)\s+ok|Tests:\s+(\d+)\s+passed/i);
  const count = match ? (match[1] || match[2] || match[3]) : "?";
  results.push({ name, cmd, exitCode, ms, pass, tests: count, outFile });
  console.log(`${pass ? "✓" : "✗"} ${name} (${ms}ms) → ${outFile}`);
  return pass;
}

runCmd("backend-unit", "npm run test --workspace=backend", PATHS.unitEvidencias + "/backend-tests.log");
runCmd("backend-smoke", "node backend/scripts/smoke-tests.mjs", PATHS.unitEvidencias + "/smoke-tests.log");
runCmd("ml-unit", "npm run ml:test", PATHS.unitEvidencias + "/ml-tests.log");

const summary = {
  timestamp: new Date().toISOString(),
  results,
  aprobados: results.filter((r) => r.pass).length,
  fallidos: results.filter((r) => !r.pass).length,
};
writeFileSync(PATHS.unitEvidencias + "/unit-summary.json", JSON.stringify(summary, null, 2));
writeFileSync(PATHS.evidenciasFinales + "/terminal/unit-tests-summary.json", JSON.stringify(summary, null, 2));

process.exit(summary.fallidos > 0 ? 1 : 0);
