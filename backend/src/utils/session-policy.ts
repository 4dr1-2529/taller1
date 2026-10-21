/**
 * FASE 2 — Política de sesiones (revocación) en utilidades puras y testeables.
 * Estas funciones devuelven los filtros `where` aplicados a la tabla Session;
 * ninguna toca la base de datos por sí mismas.
 */
import type { Prisma } from "@prisma/client";
import { toDbId } from "./ids.js";
import { hashToken } from "./tokens.js";

/**
 * Alcance del logout:
 * - Con `sid` (access token actual): revoca SOLO la sesión actual del dispositivo.
 * - Con `refreshToken` explícito (token legado sin `sid`): revoca esa sesión.
 * - Sin ninguno (cliente legado): revoca todas las sesiones del MISMO usuario
 *   (nunca las de otros usuarios: el filtro es siempre por usuarioId).
 */
export function resolveLogoutScope(userSub: string, sid?: string, refreshToken?: string): Prisma.SessionWhereInput {
  const base: Prisma.SessionWhereInput = { usuarioId: toDbId(userSub), revocada: false };
  if (sid) return { ...base, id: toDbId(sid) };
  if (refreshToken) return { ...base, tokenHash: hashToken(refreshToken) };
  return base;
}

/**
 * Alcance del cambio de contraseña: se revocan TODAS las sesiones menos la
 * actual (`sid`), para que ningún otro dispositivo conserve acceso con la
 * contraseña antigua. Sin `sid` (token legado) se revocan todas.
 */
export function resolvePasswordChangeScope(userSub: string, sid?: string): Prisma.SessionWhereInput {
  const base: Prisma.SessionWhereInput = { usuarioId: toDbId(userSub), revocada: false };
  return sid ? { ...base, id: { not: toDbId(sid) } } : base;
}
