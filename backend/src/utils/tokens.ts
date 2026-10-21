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

export function truncate(value: string | null | undefined, max: number): string | null {
  if (value == null) return null;
  return value.length <= max ? value : value.slice(0, max);
}
