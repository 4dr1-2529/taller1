import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { gradeSchema } from "../validators/schemas.js";
import { logAudit } from "../utils/audit.js";
import { paramId } from "../utils/params.js";


export async function listGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, courseId, periodo } = req.query;
    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId as string;
    if (courseId) where.courseId = courseId as string;
    if (periodo) where.periodo = periodo as string;

    const items = await prisma.grade.findMany({
      where,
      include: {
        student: { select: { id: true, codigo: true, nombres: true, apellidos: true } },
        course: { select: { id: true, codigo: true, nombre: true } },
      },
      orderBy: [{ periodo: "desc" }, { bimestre: "desc" }],
      take: 300,
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function createGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const data = gradeSchema.parse(req.body);
    const item = await prisma.grade.upsert({
      where: {
        studentId_courseId_periodo_bimestre: {
          studentId: data.studentId,
          courseId: data.courseId,
          periodo: data.periodo,
          bimestre: data.bimestre,
        },
      },
      create: data,
      update: { nota: data.nota, observacion: data.observacion },
      include: {
        student: { select: { codigo: true, nombres: true, apellidos: true } },
        course: { select: { codigo: true, nombre: true } },
      },
    });

    const agg = await prisma.grade.groupBy({
      by: ["studentId"],
      where: { studentId: data.studentId },
      _avg: { nota: true },
    });
    const avg = agg[0]?._avg.nota;
    if (avg != null) {
      await prisma.student.update({
        where: { id: data.studentId },
        data: { promedioGeneral: Math.round(avg * 100) / 100 },
      });
    }

    await logAudit({
      entidad: "Grade",
      entidadId: item.id,
      accion: "UPSERT",
      usuarioId: req.user?.sub,
      studentId: data.studentId,
    });
    res.status(201).json({ ok: true, item });
  } catch (e) {
    next(e);
  }
}

export async function deleteGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.grade.delete({ where: { id: paramId(req) } });
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
