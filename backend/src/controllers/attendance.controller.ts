import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { attendanceSchema, bulkAttendanceSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId } from "../utils/ids.js";


export async function listAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, from, to } = req.query;
    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = toDbId(studentId as string);
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
    sendSuccess(res, { items });
  } catch (e) {
    next(e);
  }
}

export async function createAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = attendanceSchema.parse(req.body);
    const record = await prisma.attendance.create({
      data: {
        studentId: toDbId(data.studentId),
        fecha: new Date(data.fecha),
        presente: data.presente,
        justificado: data.justificado,
        tardanza: data.tardanza,
        observacion: data.observacion,
      },
      include: { student: { select: { nombres: true, apellidos: true, codigo: true } } },
    });
    const sid = toDbId(data.studentId);
    const total = await prisma.attendance.count({ where: { studentId: sid } });
    const presentes = await prisma.attendance.count({
      where: { studentId: sid, presente: true },
    });
    if (total > 0) {
      await prisma.student.update({
        where: { id: sid },
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
    sendCreated(res, { record });
  } catch (e) {
    next(e);
  }
}

export async function bulkAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bulkAttendanceSchema.parse(req.body);
    const fecha = new Date(data.fecha);
    let upserted = 0;

    for (const r of data.records) {
      const studentId = toDbId(r.studentId);
      await prisma.attendance.upsert({
        where: { studentId_fecha: { studentId, fecha } },
        create: {
          studentId,
          fecha,
          presente: r.presente,
          justificado: r.justificado,
          tardanza: r.tardanza,
          observacion: r.observacion,
        },
        update: {
          presente: r.presente,
          justificado: r.justificado,
          tardanza: r.tardanza,
          observacion: r.observacion,
        },
      });
      upserted++;

      const total = await prisma.attendance.count({ where: { studentId } });
      const presentes = await prisma.attendance.count({
        where: { studentId, presente: true },
      });
      if (total > 0) {
        await prisma.student.update({
          where: { id: studentId },
          data: { asistenciaGeneral: Math.round((presentes / total) * 1000) / 10 },
        });
      }
    }

    await logAudit({
      entidad: "Attendance",
      entidadId: BigInt(0),
      accion: "BULK",
      usuarioId: req.user?.sub,
      detalle: `${upserted} registros · ${data.fecha}`,
    });

    sendCreated(res, { upserted, fecha: data.fecha });
  } catch (e) {
    next(e);
  }
}

export async function updateAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { presente, justificado } = req.body;
    const record = await prisma.attendance.update({
      where: { id: paramBigIntId(req) },
      data: { presente, justificado },
    });
    await logAudit({ entidad: "Attendance", entidadId: record.id, accion: "UPDATE", usuarioId: req.user!.sub, studentId: record.studentId });
    sendSuccess(res, { record });
  } catch (e) {
    next(e);
  }
}

export async function deleteAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    await prisma.attendance.delete({ where: { id } });
    await logAudit({ entidad: "Attendance", entidadId: id, accion: "DELETE", usuarioId: req.user!.sub });
    sendSuccess(res, {}, "Registro eliminado");
  } catch (e) {
    next(e);
  }
}
