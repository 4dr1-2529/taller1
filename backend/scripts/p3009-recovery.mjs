/**
 * Recuperación P3009 — migración fallida en MySQL Railway.
 * Solo usar si la BD está vacía o solo tiene datos de prueba.
 */
import { prismaExec } from "./prisma-exec.mjs";

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
  throw new Error(`[p3009] Migración fallida "${migrationName}". No se borrarán tablas automáticamente; corríjala manualmente.`);
}
