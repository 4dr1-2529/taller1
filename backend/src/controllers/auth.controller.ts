import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { loginSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";

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

    const user = await prisma.user.findUnique({ where: { email } });
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

    const signOpts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      signOpts,
    );

    const refreshToken = jwt.sign(
      { sub: user.id, type: "refresh" },
      env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: refreshToken,
        ipAddress: ip,
        userAgent: req.headers["user-agent"] ?? null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await logAudit({
      entidad: "User",
      entidadId: user.id,
      accion: "LOGIN",
      usuarioId: user.id,
      ipAddress: ip,
    });

    res.json({
      ok: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        role: user.role,
      },
    });
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

    const session = await prisma.session.findFirst({
      where: { userId: decoded.sub, tokenHash: refreshToken, expiresAt: { gt: new Date() } },
    });
    if (!session) throw new AppError(401, "Sesión inválida o expirada");

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.activo) throw new AppError(401, "Usuario no encontrado");

    const signOpts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
    const newToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      signOpts,
    );

    res.json({ ok: true, token: newToken });
  } catch (e) {
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, nombres: true, apellidos: true, role: true, activo: true, createdAt: true },
    });
    if (!user) throw new AppError(404, "Usuario no encontrado");
    res.json({ ok: true, user });
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new AppError(400, "Campos requeridos");
    if (newPassword.length < 8) throw new AppError(400, "Mínimo 8 caracteres");

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new AppError(404, "Usuario no encontrado");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError(401, "Contraseña actual incorrecta");

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });

    await logAudit({ entidad: "User", entidadId: user.id, accion: "CHANGE_PASSWORD", usuarioId: user.id });
    res.json({ ok: true, message: "Contraseña actualizada" });
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
