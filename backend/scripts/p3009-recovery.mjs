/**
 * Bloqueo seguro ante P3009 en MySQL Railway.
 */
import { prismaExec } from "./prisma-exec.mjs";

export function tryMigrateDeploy() {
  const result = prismaExec(["migrate", "deploy"], { stdio: "pipe" });
  if (result.status === 0) return { ok: true };

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (output.includes("P3009")) {
    return { ok: false, reason: "P3009", output };
  }

  if (result.stderr) console.error(result.stderr);
  return { ok: false, reason: "error", output };
}

export function recoverFailedInitMigration() {
  throw new Error("[p3009] Prisma detectó una migración fallida. Revise la salida real de prisma migrate deploy. No se realizarán operaciones destructivas automáticamente.");
}
