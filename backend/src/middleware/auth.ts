import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { RolCodigo } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "./errorHandler.js";

export type AuthPayload = {
  sub: string;
  email: string;
  role: RolCodigo;
};

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Token requerido", "UNAUTHORIZED"));
  }
  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    if (decoded.sub && decoded.role) {
      req.user = decoded;
      next();
    } else {
      next(new AppError(401, "Token inválido", "INVALID_TOKEN"));
    }
  } catch {
    next(new AppError(401, "Token inválido o expirado", "INVALID_TOKEN"));
  }
}

export function authenticateOrOptional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
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
