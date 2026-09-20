import { refreshAcademicSummary, academicAudit } from "../services/academic-records.service.js";
import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { gradeSchema } from "../validators/schemas.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import { assertTeacherCourseAccess, assertStudentInCourseSection } from "../utils/course-authorization.js";
import { resolvePeriodoId } from "../utils/academic-period.js";
import { courseListInclude, courseDisplayName } from "../utils/course-label.js";

export async function listGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, courseId, periodoId, periodoNumero } = req.query;
    const scope = await resolveStudentScope(req.user!);
    const where: Record<string, unknown> = { student: scope, periodo: { anioLectivo: { anio: 2026 } } };
    if (studentId) await assertStudentInScope(req.user!, String(studentId));
    if (studentId) where.studentId = toDbId(studentId as string);
    if (courseId) where.cursoOfertaId = toDbId(courseId as string);
    if (periodoId) {
      where.periodoId = toDbId(periodoId as string);
    } else if (periodoNumero != null && periodoNumero !== "") {
      where.periodoId = await resolvePeriodoId(undefined, Number(periodoNumero));
    }

    const take = courseId ? 5000 : 500;

    const rows = await prisma.grade.findMany({
      where,
      include: {
        student: { select: { id: true, codigo: true, nombres: true, apellidos: true } },
        cursoOferta: { include: courseListInclude },
        periodo: { select: { id: true, numero: true, nombre: true } },
      },
      orderBy: [{ periodo: { numero: "desc" } }, { createdAt: "desc" }],
      take,
    });

    const items = rows.map((g) => ({
      ...g,
      id: idToString(g.id),
      studentId: idToString(g.studentId),
      courseId: idToString(g.cursoOfertaId),
      cursoOfertaId: idToString(g.cursoOfertaId),
      periodoId: idToString(g.periodoId),
      bimestre: g.periodo.numero,
      nota: Number(g.nota),
      course: g.cursoOferta
        ? {
            ...g.cursoOferta,
            id: idToString(g.cursoOferta.id),
            nombre: courseDisplayName(g.cursoOferta),
          }
        : null,
    }));

    sendSuccess(res, { items });
  } catch (e) {
    next(e);
  }
}

export async function createGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const data = gradeSchema.parse(req.body);
    await assertStudentInScope(req.user!, data.studentId);
    await assertTeacherCourseAccess(req.user!, data.courseId);
    await assertStudentInCourseSection(data.studentId, data.courseId);
    const periodoId = await resolvePeriodoId(data.periodoId, data.periodoNumero);
    const studentId = toDbId(data.studentId);
    const cursoOfertaId = toDbId(data.courseId);

    const item = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM estudiante WHERE id = ${studentId} FOR UPDATE`;
      const record = await tx.grade.upsert({
      where: {
        studentId_cursoOfertaId_periodoId: { studentId, cursoOfertaId, periodoId },
      },
      create: {
        studentId,
        cursoOfertaId,
        periodoId,
        nota: data.nota,
        observacion: data.observacion,
      },
      update: { nota: data.nota, observacion: data.observacion },
      include: {
        student: { select: { codigo: true, nombres: true, apellidos: true } },
        cursoOferta: { include: { cursoCatalogo: { select: { nombre: true, codigo: true } } } },
      },
    });

      await refreshAcademicSummary(tx, studentId);
      await academicAudit(tx, req.user!.sub, "Grade", record.id, studentId, "UPSERT", req.ip);
      return record;
    });
    sendCreated(res, { item: {
        ...item,
        id: idToString(item.id),
        courseId: idToString(item.cursoOfertaId),
      }, });
  } catch (e) {
    next(e);
  }
}

export async function deleteGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.grade.findUniqueOrThrow({ where: { id: paramBigIntId(req) } });
    await assertStudentInScope(req.user!, String(existing.studentId));
    await assertTeacherCourseAccess(req.user!, String(existing.cursoOfertaId));
    const item = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM estudiante WHERE id = ${existing.studentId} FOR UPDATE`;
      const item = await tx.grade.delete({ where: { id: existing.id } });
      await refreshAcademicSummary(tx, existing.studentId);
      await academicAudit(tx, req.user!.sub, "Grade", item.id, item.studentId, "DELETE", req.ip);
      return item;
    });
    await logAudit({
      entidad: "Grade",
      entidadId: item.id,
      accion: "DELETE",
      usuarioId: req.user?.sub,
      studentId: item.studentId,
    });
    sendSuccess(res, {}, "Nota eliminada");
  } catch (e) {
    next(e);
  }
}
