#!/usr/bin/env node
/**
 * Arranque producción Railway: generate → migrate deploy → API.
 * Si detecta P3009, recupera automáticamente (BD vacía / demo).
 */
import { spawn } from "node:child_process";
import { applyEnvAliases, validateRailwayEnv } from "./env-aliases.mjs";
import {
  backendRoot,
  recoverFailedInitMigration,
  tryMigrateDeploy,
} from "./p3009-recovery.mjs";
import { prismaExecOrThrow } from "./prisma-exec.mjs";
import { spawnTsx } from "./spawn-tsx.mjs";

applyEnvAliases(process.env);

const envError = validateRailwayEnv(process.env);
if (envError) {
  console.error(envError);
  process.exit(1);
}

console.log("[railway-start] prisma generate");
prismaExecOrThrow(["generate"]);

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
  const seed = spawn(process.execPath, ["scripts/railway-seed-demo.mjs"], {
    cwd: backendRoot,
    env: process.env,
    stdio: "inherit",
    detached: true,
  });
  seed.unref();
}

if (process.env.RUN_REPAIR === "1") {
  console.log("[railway-start] RUN_REPAIR=1 — reparando cuentas y notas I–II…");
  const repair = spawnTsx(["scripts/repair-institutional-data.ts"], {
    cwd: backendRoot,
    env: process.env,
    stdio: "inherit",
    detached: true,
  });
  repair.unref();
}

console.log("[railway-start] iniciando API");
const api = spawn(process.execPath, ["dist/index.js"], {
  stdio: "inherit",
  cwd: backendRoot,
  env: process.env,
});
api.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
