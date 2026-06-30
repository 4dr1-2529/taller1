/**
 * Pipeline QA evidencias: verificar stack + capturas UI.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function run(cmd, args) {
  console.log("\n>", cmd, ...args);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("node", ["scripts/evidence/verify-stack.mjs"]);
run("node", ["scripts/evidence/capture-ui.mjs"]);
console.log("\nEvidencias en plan-pruebas/evidencias-finales/");
