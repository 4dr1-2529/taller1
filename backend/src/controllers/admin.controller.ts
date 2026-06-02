import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramId } from "../utils/params.js";


export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.user.findMany({
      select: { id: true, email: true, nombres: true, apellidos: true, role: true, activo: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, nombres, apellidos, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "Email ya registrado");

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash: hash, nombres, apellidos, role: role ?? "estudiante" },
      select: { id: true, email: true, nombres: true, apellidos: true, role: true, activo: true },
    });
    await logAudit({ entidad: "User", entidadId: user.id, accion: "CREATE", usuarioId: req.user!.sub, detalle: `Role: ${user.role}` });
    res.status(201).json({ ok: true, user });
  } catch (e) {
    next(e);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { nombres, apellidos, role, activo } = req.body;
    const user = await prisma.user.update({
      where: { id: paramId(req) },
      data: { nombres, apellidos, role, activo },
      select: { id: true, email: true, nombres: true, apellidos: true, role: true, activo: true },
    });
    await logAudit({ entidad: "User", entidadId: user.id, accion: "UPDATE", usuarioId: req.user!.sub });
    res.json({ ok: true, user });
  } catch (e) {
    next(e);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.user.delete({ where: { id: paramId(req) } });
    await logAudit({ entidad: "User", entidadId: paramId(req), accion: "DELETE", usuarioId: req.user!.sub });
    res.json({ ok: true, message: "Usuario eliminado" });
  } catch (e) {
    next(e);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;
    const teacherId = req.query.teacherId as string | undefined;
    const role = req.query.role as string | undefined;
    const entidad = req.query.entidad as string | undefined;

    const where: {
      teacherId?: string;
      entidad?: string;
      usuario?: { role: "docente" };
    } = {};

    if (teacherId) where.teacherId = teacherId;
    if (entidad) where.entidad = entidad;
    if (role === "docente") {
      where.usuario = { role: "docente" };
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          usuario: {
            select: { id: true, email: true, nombres: true, apellidos: true, role: true },
          },
          teacher: {
            select: { id: true, codigo: true, nombres: true, apellidos: true, correo: true },
          },
          student: { select: { nombres: true, apellidos: true, codigo: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ ok: true, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) {
    next(e);
  }
}

export async function getSystemStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [totalUsers, totalStudents, totalTeachers, totalPredictions, totalAlerts, totalSessions] = await Promise.all([
      prisma.user.count(),
      prisma.student.count({ where: { activo: true } }),
      prisma.teacher.count({ where: { activo: true } }),
      prisma.prediction.count(),
      prisma.alert.count({ where: { status: "abierta" } }),
      prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    ]);
    res.json({ ok: true, stats: { totalUsers, totalStudents, totalTeachers, totalPredictions, totalAlerts, totalSessions } });
  } catch (e) {
    next(e);
  }
}
