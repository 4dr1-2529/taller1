import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";
import type { RolCodigo } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "./errorHandler.js";
import { toDbId } from "../utils/ids.js";

export type AuthPayload = {
  sub: string;
  email: string;
  role: RolCodigo;
  /** Session.id vinculada al access token (tokens legados sin sid no lo llevan). */
  sid?: string;
};

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Token requerido", "UNAUTHORIZED"));
  }
  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    if (decoded.sub && decoded.role) {
      const active = await prisma.user.findFirst({ where: { id: BigInt(decoded.sub), activo: true, rol: { codigo: decoded.role } } });
      if (!active) return next(new AppError(401, "Cuenta inactiva"));
      // FASE 2: revocación efectiva — el access token deja de valer en cuanto se
      // revoca su sesión (logout o cambio de contraseña). Los tokens legados sin
      // sid conservan el comportamiento anterior hasta su expiración (≤ 8 h).
      if (decoded.sid) {
        const session = await prisma.session.findFirst({
          where: {
            id: toDbId(decoded.sid),
            usuarioId: BigInt(decoded.sub),
            revocada: false,
            expiresAt: { gt: new Date() },
          },
          select: { id: true },
        });
        if (!session) return next(new AppError(401, "Sesión revocada o expirada", "INVALID_TOKEN"));
      }
      req.user = decoded;
      next();
    } else {
      next(new AppError(401, "Token inválido", "INVALID_TOKEN"));
    }
  } catch {
    next(new AppError(401, "Token inválido o expirado", "INVALID_TOKEN"));
  }
}

export function authorize(...roles: RolCodigo[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, "No autenticado"));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Permiso denegado", "FORBIDDEN"));
    }
    next();
  };
}
