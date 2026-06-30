#!/usr/bin/env node
/**
 * Poblar demo en Railway (consola del servicio backend, raíz del monorepo):
 *   npm run railway:seed:demo
 *
 * Requiere DATABASE_URL (inyectada por Railway) y estructura previa (migrate deploy).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { prismaExecOrThrow } from "./prisma-exec.mjs";

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(backendRoot, "..");
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

function runOrExit(label, executable, args, cwd) {
  const result = spawnSync(executable, args, {
    stdio: "inherit",
    cwd,
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`[railway-seed] ${label} falló (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL no definida. Ejecute en el servicio backend de Railway.");
  process.exit(1);
}

console.log("[railway-seed] migrate deploy…");
prismaExecOrThrow(["migrate", "deploy"]);

console.log("[railway-seed] reset + seed + demo…");
runOrExit("db:reset:full", NPM, ["run", "db:reset:full", "--workspace=backend"], repoRoot);

console.log("[railway-seed] reparación final cuentas y notas…");
runOrExit("repair", NPX, ["tsx", "scripts/repair-institutional-data.ts"], backendRoot);

console.log("[railway-seed] OK — cuentas demo listas (véase DEMO_PASSWORD en Railway)");
