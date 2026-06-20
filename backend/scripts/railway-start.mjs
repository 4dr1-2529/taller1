#!/usr/bin/env node
/**
 * Arranque producción Railway: generate → migrate deploy → API.
 * Si detecta P3009, recupera automáticamente (BD vacía / demo).
 */
import { execSync } from "node:child_process";
import {
  backendRoot,
  recoverFailedInitMigration,
  run,
  tryMigrateDeploy,
} from "./p3009-recovery.mjs";

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL no está definida.");
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

console.log("[railway-start] iniciando API");
run("node dist/index.js");
