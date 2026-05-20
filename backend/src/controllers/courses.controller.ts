import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramId } from "../utils/params.js";
import { courseSchema } from "../validators/schemas.js";

export async function listCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const seccionId = req.query.seccionId as string | undefined;
    const items = await prisma.course.findMany({
      where: { activo: true, ...(seccionId ? { seccionId } : {}) },
      include: {
        profesor: { select: { id: true, nombres: true, apellidos: true } },
        cursoCatalogo: true,
      },
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function createCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { codigo, nombre, profesorId, seccionId, cursoCatalogoId, periodo } = courseSchema.parse(req.body);
    const existing = await prisma.course.findUnique({ where: { codigo } });
    if (existing) throw new AppError(409, "Código de curso ya existe");
    const course = await prisma.course.create({
      data: {
        codigo,
        nombre,
        profesorId,
        seccionId: seccionId ?? null,
        cursoCatalogoId: cursoCatalogoId ?? null,
        periodo: periodo ?? "2026",
      },
      include: { profesor: true, cursoCatalogo: true },
    });
    await logAudit({
      entidad: "Course",
      entidadId: course.id,
      accion: "CREATE",
      usuarioId: req.user?.sub,
    });
    res.status(201).json({ ok: true, course });
  } catch (e) {
    next(e);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { nombre, profesorId, seccionId, activo } = req.body;
    const course = await prisma.course.update({
      where: { id: paramId(req) },
      data: { nombre, profesorId, seccionId, activo },
      include: { profesor: true },
    });
    await logAudit({
      entidad: "Course",
      entidadId: course.id,
      accion: "UPDATE",
      usuarioId: req.user?.sub,
    });
    res.json({ ok: true, course });
  } catch (e) {
    next(e);
  }
}

export async function deleteCourse(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.course.update({
      where: { id: paramId(req) },
      data: { activo: false },
    });
    await logAudit({
      entidad: "Course",
      entidadId: paramId(req),
      accion: "DELETE",
      usuarioId: req.user?.sub,
    });
    res.json({ ok: true, message: "Curso desactivado" });
  } catch (e) {
    next(e);
  }
}
