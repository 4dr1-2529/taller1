import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import type { RolCodigo } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";
import { getRolId, mapUserWithRole } from "../utils/rol.js";
import { createUserSchema } from "../validators/schemas.js";

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        activo: true,
        createdAt: true,
        rol: { select: { codigo: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const items = rows.map((u) => ({
      ...mapUserWithRole(u),
      id: idToString(u.id),
    }));
    sendSuccess(res, { items });
  } catch (e) {
    next(e);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, nombres, apellidos, role } = createUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "Email ya registrado");

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(password, 12);
    const rolId = await getRolId((role ?? "estudiante") as RolCodigo);
    const user = await prisma.user.create({
      data: { email, passwordHash: hash, nombres, apellidos, rolId },
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        activo: true,
        rol: { select: { codigo: true } },
      },
    });
    const mapped = { ...mapUserWithRole(user), id: idToString(user.id) };
    await logAudit({
      entidad: "User",
      entidadId: user.id,
      accion: "CREATE",
      usuarioId: req.user!.sub,
      detalle: `Role: ${mapped.role}`,
    });
    sendCreated(res, { user: mapped });
  } catch (e) {
    next(e);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { nombres, apellidos, role, activo } = req.body;
    const data: { nombres?: string; apellidos?: string; activo?: boolean; rolId?: bigint } = {
      nombres,
      apellidos,
      activo,
    };
    if (role) data.rolId = await getRolId(role as RolCodigo);

    const user = await prisma.user.update({
      where: { id: paramBigIntId(req) },
      data,
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        activo: true,
        rol: { select: { codigo: true } },
      },
    });
    await logAudit({
      entidad: "User",
      entidadId: user.id,
      accion: "UPDATE",
      usuarioId: req.user!.sub,
    });
    sendSuccess(res, { user: { ...mapUserWithRole(user), id: idToString(user.id) } });
  } catch (e) {
    next(e);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    await prisma.user.delete({ where: { id } });
    await logAudit({ entidad: "User", entidadId: id, accion: "DELETE", usuarioId: req.user!.sub });
    sendSuccess(res, {}, "Usuario eliminado");
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
      profesorId?: bigint;
      entidad?: string;
      usuario?: { rol: { codigo: "docente" } };
    } = {};

    if (teacherId) where.profesorId = toDbId(teacherId);
    if (entidad) where.entidad = entidad;
    if (role === "docente") {
      where.usuario = { rol: { codigo: "docente" } };
    }

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              nombres: true,
              apellidos: true,
              rol: { select: { codigo: true } },
            },
          },
          profesor: { select: { id: true, codigo: true, nombres: true, apellidos: true, email: true } },
          estudiante: { select: { nombres: true, apellidos: true, codigo: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const items = rows.map((row) => ({
      ...row,
      id: idToString(row.id),
      usuario: row.usuario
        ? {
            ...mapUserWithRole(row.usuario),
            id: idToString(row.usuario.id),
          }
        : null,
      teacher: row.profesor
        ? { ...row.profesor, id: idToString(row.profesor.id) }
        : null,
      student: row.estudiante,
    }));

    sendSuccess(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) {
    next(e);
  }
}

export async function getSystemStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [totalUsers, totalStudents, totalTeachers, totalPredictions, totalAlerts, totalSessions] =
      await Promise.all([
        prisma.user.count(),
        prisma.student.count({ where: { activo: true } }),
        prisma.teacher.count({ where: { activo: true } }),
        prisma.prediction.count(),
        prisma.alert.count({ where: { estado: { in: ["nueva", "en_seguimiento"] } } }),
        prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
      ]);
    sendSuccess(res, { stats: { totalUsers, totalStudents, totalTeachers, totalPredictions, totalAlerts, totalSessions }, });
  } catch (e) {
    next(e);
  }
}
