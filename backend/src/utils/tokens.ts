import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

/** Hash para columnas token_hash / refresh_hash (VARCHAR 128). */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type AccessClaims = { sub: string; email: string; role: string; sid?: string };

/**
 * Firma el access token con la sesión vinculada (`sid` = Session.id).
 * `authenticate` exige que esa sesión siga viva → el logout la revoca y el
 * access token deja de ser válido de inmediato (antes permanecía válido 8 h).
 * Los tokens sin `sid` (emitidos antes de este cambio) siguen aceptándose
 * hasta su expiración para no bloquear sesiones existentes al desplegar.
 */
export function signAccessToken(
  claims: AccessClaims,
  secret: string,
  expiresIn: SignOptions["expiresIn"],
): string {
  return jwt.sign(
    { sub: claims.sub, email: claims.email, role: claims.role, ...(claims.sid ? { sid: claims.sid } : {}) },
    secret,
    { expiresIn },
  );
}

/**
 * SPRINT 5 — Refresh token con `jti` único por emisión. La sesión en BD guarda
 * solo el hash del token vigente (`token_hash`) y del anterior (`refresh_hash`),
 * de modo que cada renovación invalida criptográficamente la anterior.
 */
export function signRefreshToken(sub: string, secret: string, expiresIn: SignOptions["expiresIn"]): string {
  return jwt.sign({ sub, type: "refresh", jti: crypto.randomUUID() }, secret, { expiresIn });
}

/**
 * SPRINT 5 — Expiración real (claim `exp`) de un JWT firmado; alinea las
 * columnas `expires_at` / `refresh_expires` de la sesión con el propio token.
 */
export function refreshExpiryDate(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const exp = decoded?.exp;
  return new Date((exp ?? Math.floor(Date.now() / 1000) + 7 * 24 * 3600) * 1000);
}

export function truncate(value: string | null | undefined, max: number): string | null {
  if (value == null) return null;
  return value.length <= max ? value : value.slice(0, max);
}
