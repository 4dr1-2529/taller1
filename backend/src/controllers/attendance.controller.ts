import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { attendanceSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramId } from "../utils/params.js";


export async function listAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, from, to } = req.query;
    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId as string;
    if (from || to) {
      where.fecha = {};
      if (from) (where.fecha as Record<string, unknown>).gte = new Date(from as string);
      if (to) (where.fecha as Record<string, unknown>).lte = new Date(to as string);
    }
    const items = await prisma.attendance.findMany({
      where,
      include: { student: { select: { nombres: true, apellidos: true, codigo: true } } },
      orderBy: { fecha: "desc" },
      take: 200,
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function createAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = attendanceSchema.parse(req.body);
    const record = await prisma.attendance.create({
      data: {
        studentId: data.studentId,
        fecha: new Date(data.fecha),
        presente: data.presente,
        justificado: data.justificado,
        tardanza: data.tardanza,
        observacion: data.observacion,
      },
      include: { student: { select: { nombres: true, apellidos: true, codigo: true } } },
    });
    const total = await prisma.attendance.count({ where: { studentId: data.studentId } });
    const presentes = await prisma.attendance.count({
      where: { studentId: data.studentId, presente: true },
    });
    if (total > 0) {
      await prisma.student.update({
        where: { id: data.studentId },
        data: { asistenciaGeneral: Math.round((presentes / total) * 1000) / 10 },
      });
    }
    await logAudit({
      entidad: "Attendance",
      entidadId: record.id,
      accion: "CREATE",
      usuarioId: req.user?.sub,
      studentId: data.studentId,
    });
    res.status(201).json({ ok: true, record });
  } catch (e) {
    next(e);
  }
}

export async function bulkAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) throw new AppError(400, "Array de registros requerido");
    const created = await prisma.attendance.createMany({
      data: records.map((r: Record<string, unknown>) => ({
        studentId: r.studentId as string,
        fecha: new Date(r.fecha as string),
        presente: r.presente as boolean ?? true,
        justificado: r.justificado as boolean ?? false,
      })),
    });
    res.status(201).json({ ok: true, created: created.count });
  } catch (e) {
    next(e);
  }
}

export async function updateAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { presente, justificado } = req.body;
    const record = await prisma.attendance.update({
      where: { id: paramId(req) },
      data: { presente, justificado },
    });
    await logAudit({ entidad: "Attendance", entidadId: record.id, accion: "UPDATE", usuarioId: req.user!.sub, studentId: record.studentId });
    res.json({ ok: true, record });
  } catch (e) {
    next(e);
  }
}

export async function deleteAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.attendance.delete({ where: { id: paramId(req) } });
    await logAudit({ entidad: "Attendance", entidadId: paramId(req), accion: "DELETE", usuarioId: req.user!.sub });
    res.json({ ok: true, message: "Registro eliminado" });
  } catch (e) {
    next(e);
  }
}
