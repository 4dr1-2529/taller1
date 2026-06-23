#!/usr/bin/env node
/**
 * Arranque producción Railway: generate → migrate deploy → API.
 * Si detecta P3009, recupera automáticamente (BD vacía / demo).
 */
import { execSync, spawn } from "node:child_process";
import { applyEnvAliases, validateRailwayEnv } from "./env-aliases.mjs";
import {
  backendRoot,
  recoverFailedInitMigration,
  tryMigrateDeploy,
} from "./p3009-recovery.mjs";

applyEnvAliases(process.env);

const envError = validateRailwayEnv(process.env);
if (envError) {
  console.error(envError);
  process.exit(1);
}

console.log("[railway-start] prisma generate");
execSync("npx prisma generate", { stdio: "inherit", cwd: backendRoot, env: process.env });

console.log("[railway-start] prisma migrate deploy");
const result = tryMigrateDeploy();

if (!result.ok && result.reason === "P3009") {
  recoverFailedInitMigration();
} else if (!result.ok) {
  console.error("[railway-start] migrate deploy falló (no P3009). Revise DATABASE_URL y logs.");
  process.exit(1);
} else {
  console.log("[railway-start] migraciones OK");
}

if (process.env.RUN_DEMO_SEED === "1") {
  console.log("[railway-start] RUN_DEMO_SEED=1 — poblando demo en segundo plano…");
  const seed = spawn("node", ["scripts/railway-seed-demo.mjs"], {
    cwd: backendRoot,
    env: process.env,
    stdio: "inherit",
    detached: true,
  });
  seed.unref();
}

console.log("[railway-start] iniciando API");
const api = spawn("node", ["dist/index.js"], {
  stdio: "inherit",
  cwd: backendRoot,
  env: process.env,
});
api.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
