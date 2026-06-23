#!/usr/bin/env node
/**
 * Poblar demo en Railway (consola del servicio backend, raíz del monorepo):
 *   npm run railway:seed:demo
 *
 * Requiere DATABASE_URL (inyectada por Railway) y estructura previa (migrate deploy).
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const backendRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(backendRoot, "../..");

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL no definida. Ejecute en el servicio backend de Railway.");
  process.exit(1);
}

console.log("[railway-seed] migrate deploy…");
execSync("npx prisma migrate deploy", { stdio: "inherit", cwd: backendRoot, env: process.env });

console.log("[railway-seed] reset + seed + demo…");
execSync("npm run db:reset:full --workspace=backend", {
  stdio: "inherit",
  cwd: repoRoot,
  env: process.env,
});

console.log("[railway-seed] OK — director@blenkir.edu.pe / mbappe29");
