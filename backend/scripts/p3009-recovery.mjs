/**
 * Recuperación P3009 — migración fallida en MySQL Railway.
 * Solo usar si la BD está vacía o solo tiene datos de prueba.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backendRoot, prismaExec, prismaExecOrThrow } from "./prisma-exec.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export { backendRoot };
export const migrationName = "20250609120000_init";

export function tryMigrateDeploy() {
  const result = prismaExec(["migrate", "deploy"], { stdio: "pipe" });
  if (result.status === 0) return { ok: true };

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (output.includes("P3009")) return { ok: false, reason: "P3009" };

  if (result.stderr) console.error(result.stderr);
  return { ok: false, reason: "error" };
}

export function recoverFailedInitMigration() {
  console.warn(`[p3009] Recuperando migración fallida "${migrationName}"...`);

  const resolveResult = prismaExec(
    ["migrate", "resolve", "--rolled-back", migrationName],
    { stdio: "pipe" },
  );
  if (resolveResult.status !== 0) {
    console.warn("[p3009] resolve --rolled-back omitido (ya resuelto o sin registro)");
  }

  const sqlPath = path.join(__dirname, "railway-drop-all-tables.sql");
  const dropFile = path.join(backendRoot, ".railway-drop-temp.sql");
  fs.writeFileSync(dropFile, fs.readFileSync(sqlPath, "utf8"), "utf8");
  try {
    prismaExecOrThrow(["db", "execute", "--file", dropFile, "--schema", "prisma/schema.prisma"]);
    console.log("[p3009] tablas parciales eliminadas");
  } finally {
    if (fs.existsSync(dropFile)) fs.unlinkSync(dropFile);
  }

  prismaExecOrThrow(["migrate", "deploy"]);
  console.log("[p3009] migrate deploy completado");
}
