import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./errorHandler.js";
import type { UserRole } from "@prisma/client";

export type AuthPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Token requerido", "UNAUTHORIZED"));
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    next();
  } catch {
    next(new AppError(401, "Token inválido o expirado", "INVALID_TOKEN"));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, "No autenticado"));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Permiso denegado", "FORBIDDEN"));
    }
    next();
  };
}
