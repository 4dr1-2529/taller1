import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { gradeSchema } from "../validators/schemas.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import { resolvePeriodoId } from "../utils/academic-period.js";
import { courseListInclude, courseDisplayName } from "../utils/course-label.js";

export async function listGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, courseId, periodoId } = req.query;
    const scope = await resolveStudentScope(req.user!);
    const where: Record<string, unknown> = { student: scope };
    if (studentId) where.studentId = toDbId(studentId as string);
    if (courseId) where.cursoOfertaId = toDbId(courseId as string);
    if (periodoId) where.periodoId = toDbId(periodoId as string);

    const rows = await prisma.grade.findMany({
      where,
      include: {
        student: { select: { id: true, codigo: true, nombres: true, apellidos: true } },
        cursoOferta: { include: courseListInclude },
        periodo: { select: { id: true, numero: true, nombre: true } },
      },
      orderBy: [{ periodo: { numero: "desc" } }, { createdAt: "desc" }],
      take: 300,
    });

    const items = rows.map((g) => ({
      ...g,
      id: idToString(g.id),
      studentId: idToString(g.studentId),
      courseId: idToString(g.cursoOfertaId),
      cursoOfertaId: idToString(g.cursoOfertaId),
      periodoId: idToString(g.periodoId),
      course: g.cursoOferta
        ? {
            ...g.cursoOferta,
            id: idToString(g.cursoOferta.id),
            nombre: courseDisplayName(g.cursoOferta),
          }
        : null,
    }));

    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function createGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const data = gradeSchema.parse(req.body);
    await assertStudentInScope(req.user!, data.studentId);
    const periodoId = await resolvePeriodoId(data.periodoId, data.periodoNumero);
    const studentId = toDbId(data.studentId);
    const cursoOfertaId = toDbId(data.courseId);

    const item = await prisma.grade.upsert({
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

    const agg = await prisma.grade.groupBy({
      by: ["studentId"],
      where: { studentId },
      _avg: { nota: true },
    });
    const avg = agg[0]?._avg.nota;
    if (avg != null) {
      await prisma.student.update({
        where: { id: studentId },
        data: { promedioGeneral: Math.round(Number(avg) * 100) / 100 },
      });
    }

    await logAudit({
      entidad: "Grade",
      entidadId: item.id,
      accion: "UPSERT",
      usuarioId: req.user?.sub,
      studentId,
    });
    res.status(201).json({
      ok: true,
      item: {
        ...item,
        id: idToString(item.id),
        courseId: idToString(item.cursoOfertaId),
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.grade.delete({ where: { id: paramBigIntId(req) } });
    await logAudit({
      entidad: "Grade",
      entidadId: item.id,
      accion: "DELETE",
      usuarioId: req.user?.sub,
      studentId: item.studentId,
    });
    res.json({ ok: true, message: "Nota eliminada" });
  } catch (e) {
    next(e);
  }
}
