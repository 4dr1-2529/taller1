import { recordLmsEvent } from "../services/lms.service.js";
import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { changePasswordSchema, loginSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { toDbId, idToString } from "../utils/ids.js";
import { mapUserWithRole } from "../utils/rol.js";
import { hashToken, refreshExpiryDate, signAccessToken, signRefreshToken, truncate } from "../utils/tokens.js";
import { resolveLogoutScope, resolvePasswordChangeScope } from "../utils/session-policy.js";

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const attempts = loginAttempts.get(ip);
    if (attempts && attempts.count >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - attempts.lastAttempt;
      if (elapsed < LOCKOUT_MS) {
        throw new AppError(429, `Demasiados intentos. Intente en ${Math.ceil((LOCKOUT_MS - elapsed) / 60000)} min`, "RATE_LIMITED");
      }
      loginAttempts.delete(ip);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        rol: { select: { codigo: true } },
        profesor: { select: { id: true, codigo: true } },
      },
    });
    if (!user || !user.activo) {
      trackAttempt(ip);
      throw new AppError(401, "Credenciales incorrectas");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      trackAttempt(ip);
      throw new AppError(401, "Credenciales incorrectas");
    }

    loginAttempts.delete(ip);

    const role = user.rol.codigo;
    const signOpts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };

    // SPRINT 5 — Refresh con jti único; la sesión guarda el hash del vigente.
    const refreshToken = signRefreshToken(
      idToString(user.id),
      env.JWT_SECRET,
      env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
    );
    const refreshExpiresAt = refreshExpiryDate(refreshToken);

    // La sesión se crea ANTES del access token para poder vincularlo (sid) y
    // que logout/cambio de contraseña invaliden el access token de inmediato.
    const session = await prisma.session.create({
      data: {
        usuarioId: user.id,
        tokenHash: hashToken(refreshToken),
        ipAddress: truncate(ip, 45),
        userAgent: truncate(req.headers["user-agent"], 255),
        expiresAt: refreshExpiresAt,
        refreshExpires: refreshExpiresAt,
      },
    });

    const token = signAccessToken(
      { sub: idToString(user.id), email: user.email, role, sid: idToString(session.id) },
      env.JWT_SECRET,
      signOpts.expiresIn,
    );

    await logAudit({
      entidad: "User",
      entidadId: user.id,
      accion: "LOGIN",
      usuarioId: user.id,
      ipAddress: ip,
    });

    await recordLmsEvent({ sub: String(user.id), role }, "login");
    sendSuccess(res, { token,
      refreshToken,
      user: {
        id: idToString(user.id),
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        role,
        teacherId: user.profesor ? idToString(user.profesor.id) : null,
      }, });
  } catch (e) {
    next(e);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError(400, "Refresh token requerido");

    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as { sub: string; type: string };
    if (decoded.type !== "refresh") throw new AppError(401, "Token inválido");

    // SPRINT 5 — Rotación segura: la sesión se localiza por el hash del token
    // vigente (token_hash) o del recién rotado (refresh_hash).
    const presentedHash = hashToken(refreshToken);
    const session = await prisma.session.findFirst({
      where: {
        usuarioId: toDbId(decoded.sub),
        OR: [{ tokenHash: presentedHash }, { refreshHash: presentedHash }],
        expiresAt: { gt: new Date() },
        revocada: false,
      },
    });
    if (!session) throw new AppError(401, "Sesión inválida o expirada");

    // Detección de reutilización: el token presentado YA fue rotado.
    if (session.refreshHash === presentedHash) {
      const rotatedAt = session.refreshRotatedAt?.getTime() ?? 0;
      if (Date.now() - rotatedAt <= env.REFRESH_REUSE_GRACE_MS) {
        // Renovación concurrente legítima (otra pestaña/proceso llegó primero):
        // 401 SIN revocar; el cliente reintenta con el token vigente que ya
        // guardó quien ganó la carrera.
        throw new AppError(401, "Refresh token ya renovado; use el token vigente");
      }
      // Reutilización fuera de la ventana de gracia = posible robo: se revoca
      // ESA sesión (familia = sesión); las demás sesiones del mismo usuario y
      // las de otros usuarios quedan intactas.
      await prisma.session.updateMany({ where: { id: session.id, revocada: false }, data: { revocada: true } });
      await logAudit({
        entidad: "Session",
        entidadId: session.id,
        accion: "REFRESH_REUSE_DETECTED",
        usuarioId: toDbId(decoded.sub),
        ipAddress: req.ip ?? req.socket.remoteAddress ?? undefined,
        detalle: "Reutilización de refresh token rotado fuera de la ventana de gracia; sesión revocada",
      });
      throw new AppError(401, "Reutilización de refresh token detectada; sesión revocada");
    }

    const user = await prisma.user.findUnique({
      where: { id: toDbId(decoded.sub) },
      include: { rol: { select: { codigo: true } } },
    });
    if (!user || !user.activo) throw new AppError(401, "Usuario no encontrado");

    // Rotación atómica (compare-and-swap por hash vigente): de dos
    // renovaciones concurrentes con el mismo token solo una gana; la otra
    // recibe 401 sin revocar la sesión.
    const newRefreshToken = signRefreshToken(
      idToString(user.id),
      env.JWT_SECRET,
      env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
    );
    const rotated = await prisma.session.updateMany({
      where: { id: session.id, tokenHash: presentedHash, revocada: false },
      data: {
        tokenHash: hashToken(newRefreshToken),
        refreshHash: presentedHash,
        refreshExpires: refreshExpiryDate(newRefreshToken),
        refreshRotatedAt: new Date(),
      },
    });
    if (rotated.count === 0) {
      throw new AppError(401, "Refresh token ya renovado; use el token vigente");
    }

    const signOpts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
    // El nuevo access token mantiene la vinculación a la misma sesión (sid).
    const newToken = signAccessToken(
      { sub: idToString(user.id), email: user.email, role: user.rol.codigo, sid: idToString(session.id) },
      env.JWT_SECRET,
      signOpts.expiresIn,
    );

    sendSuccess(res, { token: newToken, refreshToken: newRefreshToken });
  } catch (e) {
    next(e);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body ?? {};
    // Revoca solo la sesión actual (sid del access token) o la indicada; sin
    // indicación explícita mantiene el comportamiento legado (todas del MISMO
    // usuario — nunca toca sesiones de otros usuarios).
    await prisma.session.updateMany({
      where: resolveLogoutScope(req.user!.sub, req.user!.sid, refreshToken),
      data: { revocada: true },
    });
    await logAudit({ entidad: "User", entidadId: toDbId(req.user!.sub), accion: "LOGOUT", usuarioId: toDbId(req.user!.sub) });
    await recordLmsEvent(req.user!, "logout");
    sendSuccess(res, { loggedOut: true });
  } catch (e) {
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: toDbId(req.user!.sub) },
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        activo: true,
        createdAt: true,
        rol: { select: { codigo: true } },
        profesor: { select: { id: true, codigo: true, especialidad: true } },
      },
    });
    if (!user) throw new AppError(404, "Usuario no encontrado");
    sendSuccess(res, { user: {
        ...mapUserWithRole(user),
        id: idToString(user.id),
        teacherId: user.profesor ? idToString(user.profesor.id) : null,
      }, });
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: toDbId(req.user!.sub) } });
    if (!user) throw new AppError(404, "Usuario no encontrado");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError(401, "Contraseña actual incorrecta");

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });

    // FASE 2: cambiar la contraseña revoca las demás sesiones (otros dispositivos
    // quedan fuera); la sesión actual (sid) se conserva para no expulsar al usuario.
    await prisma.session.updateMany({
      where: resolvePasswordChangeScope(idToString(user.id), req.user!.sid),
      data: { revocada: true },
    });

    await logAudit({ entidad: "User", entidadId: user.id, accion: "CHANGE_PASSWORD", usuarioId: user.id });
    sendSuccess(res, {}, "Contraseña actualizada");
  } catch (e) {
    next(e);
  }
}

function trackAttempt(ip: string) {
  const existing = loginAttempts.get(ip);
  if (existing) {
    existing.count++;
    existing.lastAttempt = Date.now();
  } else {
    loginAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
  }
}
