import { refreshAcademicSummary, academicAudit } from "../services/academic-records.service.js";
import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { attendanceSchema, bulkAttendanceSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId } from "../utils/ids.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";

export async function listAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, from, to, seccionId } = req.query;
    const scope = await resolveStudentScope(req.user!);
    const studentWhere: Record<string, unknown> = { AND: [scope] };
    if (seccionId) studentWhere.seccionId = toDbId(seccionId as string);
    const where: Record<string, unknown> = { student: studentWhere, fecha: { gte: new Date("2026-01-01"), lt: new Date("2027-01-01") } };
    if (studentId) await assertStudentInScope(req.user!, String(studentId));
    if (studentId) where.studentId = toDbId(studentId as string);
    if (from || to) {
      where.AND = [{ fecha: { gte: new Date("2026-01-01"), lt: new Date("2027-01-01") } }];
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
    await assertStudentInScope(req.user!, data.studentId);
    const studentId = toDbId(data.studentId);
    const record = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM estudiante WHERE id = ${studentId} FOR UPDATE`;
      const record = await tx.attendance.create({ data: { ...data, studentId, fecha: new Date(data.fecha) } });
      await refreshAcademicSummary(tx, studentId);
      await academicAudit(tx, req.user!.sub, "Attendance", record.id, studentId, "CREATE", req.ip);
      return record;
    });
    sendCreated(res, { record });
  } catch (e) { next(e); }
}
export async function bulkAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bulkAttendanceSchema.parse(req.body);
    for (const record of data.records) await assertStudentInScope(req.user!, record.studentId);
    const fecha = new Date(data.fecha);
    await prisma.$transaction(async tx => {
      for (const r of [...data.records].sort((a,b) => Number(a.studentId) - Number(b.studentId))) {
        const studentId = toDbId(r.studentId);
        await tx.$queryRaw`SELECT id FROM estudiante WHERE id = ${studentId} FOR UPDATE`;
        const record = await tx.attendance.upsert({ where: { studentId_fecha: { studentId, fecha } }, create: { ...r, studentId, fecha }, update: { presente: r.presente, justificado: r.justificado, tardanza: r.tardanza, observacion: r.observacion } });
        await refreshAcademicSummary(tx, studentId);
        await academicAudit(tx, req.user!.sub, "Attendance", record.id, studentId, "UPSERT", req.ip);
      }
    }, { timeout: 20000 });
    sendCreated(res, { upserted: data.records.length, fecha: data.fecha });
  } catch (e) { next(e); }
}
export async function updateAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    const existing = await prisma.attendance.findUniqueOrThrow({ where: { id } });
    await assertStudentInScope(req.user!, String(existing.studentId));
    const data = attendanceSchema.omit({ studentId: true, fecha: true }).parse(req.body);
    const record = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM estudiante WHERE id = ${existing.studentId} FOR UPDATE`;
      const record = await tx.attendance.update({ where: { id }, data });
      await refreshAcademicSummary(tx, existing.studentId);
      await academicAudit(tx, req.user!.sub, "Attendance", id, existing.studentId, "UPDATE", req.ip);
      return record;
    });
    sendSuccess(res, { record });
  } catch (e) { next(e); }
}
export async function deleteAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    const existing = await prisma.attendance.findUniqueOrThrow({ where: { id } });
    await assertStudentInScope(req.user!, String(existing.studentId));
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM estudiante WHERE id = ${existing.studentId} FOR UPDATE`;
      await tx.attendance.delete({ where: { id } });
      await refreshAcademicSummary(tx, existing.studentId);
      await academicAudit(tx, req.user!.sub, "Attendance", id, existing.studentId, "DELETE", req.ip);
    });
    sendSuccess(res, {}, "Registro eliminado");
  } catch (e) { next(e); }
}
