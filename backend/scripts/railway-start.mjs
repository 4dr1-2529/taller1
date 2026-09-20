#!/usr/bin/env node
/**
 * Arranque producción Railway: generate → migrate deploy → API.
 * Si detecta P3009, detiene el despliegue sin borrar tablas.
 */
import { spawn } from "node:child_process";
import { applyEnvAliases, validateRailwayEnv } from "./env-aliases.mjs";
import {
  recoverFailedInitMigration,
  tryMigrateDeploy,
} from "./p3009-recovery.mjs";
import {
  backendRoot,
  prismaExecOrThrow,
} from "./prisma-exec.mjs";

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
  console.error(result.output);
  recoverFailedInitMigration();
} else if (!result.ok) {
  console.error("[railway-start] migrate deploy falló (no P3009). Revise DATABASE_URL y logs.");
  process.exit(1);
} else {
  console.log("[railway-start] migraciones OK");
}

// No population or repair scripts run during deployment.
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
