/**
 * Recuperación P3009 — migración fallida en MySQL Railway.
 * Solo usar si la BD está vacía o solo tiene datos de prueba.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const backendRoot = path.join(__dirname, "..");
export const migrationName = "20250609120000_init";

export function run(cmd, cwd = backendRoot) {
  execSync(cmd, { stdio: "inherit", cwd, env: process.env });
}

export function tryMigrateDeploy() {
  try {
    execSync("npx prisma migrate deploy", {
      cwd: backendRoot,
      env: process.env,
      stdio: "pipe",
      encoding: "utf8",
    });
    return { ok: true };
  } catch (err) {
    const output = `${err.stdout ?? ""}${err.stderr ?? ""}${err.message ?? ""}`;
    if (output.includes("P3009")) return { ok: false, reason: "P3009" };
    console.error(err.stderr?.toString() ?? err.message);
    return { ok: false, reason: "error" };
  }
}

export function recoverFailedInitMigration() {
  console.warn(`[p3009] Recuperando migración fallida "${migrationName}"...`);

  try {
    run(`npx prisma migrate resolve --rolled-back "${migrationName}"`);
  } catch {
    console.warn("[p3009] resolve --rolled-back omitido (ya resuelto o sin registro)");
  }

  const sqlPath = path.join(__dirname, "railway-drop-all-tables.sql");
  const dropFile = path.join(backendRoot, ".railway-drop-temp.sql");
  fs.writeFileSync(dropFile, fs.readFileSync(sqlPath, "utf8"), "utf8");
  try {
    run(`npx prisma db execute --file "${dropFile}" --schema prisma/schema.prisma`);
    console.log("[p3009] tablas parciales eliminadas");
  } finally {
    if (fs.existsSync(dropFile)) fs.unlinkSync(dropFile);
  }

  run("npx prisma migrate deploy");
  console.log("[p3009] migrate deploy completado");
}
