import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { loginSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.activo) throw new AppError(401, "Credenciales inválidas");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError(401, "Credenciales inválidas");

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN },
    );

    await logAudit({
      entidad: "User",
      entidadId: user.id,
      accion: "LOGIN",
      detalle: user.email,
      ipAddress: req.ip,
    });

    res.json({
      ok: true,
      token,
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

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, nombres: true, apellidos: true, role: true },
    });
    if (!user) throw new AppError(404, "Usuario no encontrado");
    res.json({ ok: true, user });
  } catch (e) {
    next(e);
  }
}
