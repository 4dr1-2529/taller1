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
    const { studentId, from, to, fecha: fechaQuery, seccionId, gradoId, q } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
    const skip = (page - 1) * limit;
    const scope = await resolveStudentScope(req.user!);
    const studentWhere: Record<string, unknown> = { AND: [scope] };
    if (seccionId) studentWhere.seccionId = toDbId(seccionId as string);
    if (gradoId) studentWhere.seccion = { gradoId: toDbId(gradoId as string) };
    const query = String(q ?? "").trim();
    if (query) {
      studentWhere.OR = [
        { nombres: { contains: query } },
        { apellidos: { contains: query } },
        { codigo: { contains: query } },
      ];
    }
    if (studentId) await assertStudentInScope(req.user!, String(studentId));
    const where: Record<string, unknown> = { student: studentWhere };
    if (studentId) where.studentId = toDbId(studentId as string);
    const fecha: Record<string, unknown> = { gte: new Date("2026-01-01"), lt: new Date("2027-01-01") };
    const dia = String(fechaQuery ?? "").trim();
    if (/^2026-\d{2}-\d{2}$/.test(dia)) {
      // Día exacto normalizado a UTC: idéntica semántica que create/bulk (fecha YYYY-MM-DD).
      const base = new Date(`${dia}T00:00:00.000Z`);
      if (!Number.isNaN(base.getTime())) {
        fecha.gte = base;
        fecha.lt = new Date(base.getTime() + 86_400_000);
      }
    } else {
      if (from) {
        const gte = new Date(from as string);
        if (gte > (fecha.gte as Date)) fecha.gte = gte;
      }
      if (to) fecha.lte = new Date(to as string);
    }
    where.fecha = fecha;
    const [items, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { student: { select: { nombres: true, apellidos: true, codigo: true } } },
        orderBy: { fecha: "desc" },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);
    sendSuccess(res, { items, total, page, pages: Math.ceil(total / limit) || 1 });
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
