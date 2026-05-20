import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramId } from "../utils/params.js";
import { teacherSchema } from "../validators/schemas.js";

const courseInclude = {
  where: { activo: true as const },
  select: {
    id: true,
    codigo: true,
    nombre: true,
    seccionId: true,
    periodo: true,
    cursoCatalogo: { select: { nombre: true, area: true } },
  },
  orderBy: { nombre: "asc" as const },
};

export async function listTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.teacher.findMany({
      where: { activo: true },
      include: {
        courses: courseInclude,
        _count: { select: { courses: true } },
      },
      orderBy: { apellidos: "asc" },
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function createTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const data = teacherSchema.parse(req.body);
    const { cursos, ...teacherData } = data;

    const existing = await prisma.teacher.findUnique({ where: { codigo: teacherData.codigo } });
    if (existing) throw new AppError(409, "Código de profesor ya existe");

    const teacher = await prisma.$transaction(async (tx) => {
      const created = await tx.teacher.create({
        data: {
          ...teacherData,
          telefono: teacherData.telefono ?? null,
        },
      });

      if (cursos?.length) {
        for (const c of cursos) {
          const dup = await tx.course.findUnique({ where: { codigo: c.codigo } });
          if (dup) throw new AppError(409, `El curso con código ${c.codigo} ya existe`);
          await tx.course.create({
            data: {
              codigo: c.codigo,
              nombre: c.nombre,
              profesorId: created.id,
              seccionId: c.seccionId ?? null,
              cursoCatalogoId: c.cursoCatalogoId ?? null,
              periodo: c.periodo ?? "2026",
            },
          });
        }
      }

      return tx.teacher.findUniqueOrThrow({
        where: { id: created.id },
        include: { courses: courseInclude, _count: { select: { courses: true } } },
      });
    });

    await logAudit({
      entidad: "Teacher",
      entidadId: teacher.id,
      accion: "CREATE",
      usuarioId: req.user!.sub,
      teacherId: teacher.id,
      detalle: cursos?.length ? `${cursos.length} curso(s) asignado(s)` : undefined,
    });
    res.status(201).json({ ok: true, teacher });
  } catch (e) {
    next(e);
  }
}

export async function updateTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const { nombres, apellidos, especialidad, correo, telefono, activo } = req.body;
    const teacher = await prisma.teacher.update({
      where: { id: paramId(req) },
      data: { nombres, apellidos, especialidad, correo, telefono, activo },
      include: { courses: courseInclude },
    });
    await logAudit({
      entidad: "Teacher",
      entidadId: teacher.id,
      accion: "UPDATE",
      usuarioId: req.user!.sub,
      teacherId: teacher.id,
    });
    res.json({ ok: true, teacher });
  } catch (e) {
    next(e);
  }
}

export async function deleteTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    await prisma.$transaction([
      prisma.course.updateMany({ where: { profesorId: id }, data: { activo: false } }),
      prisma.teacher.update({ where: { id }, data: { activo: false } }),
    ]);
    await logAudit({
      entidad: "Teacher",
      entidadId: id,
      accion: "DELETE",
      usuarioId: req.user!.sub,
    });
    res.json({ ok: true, message: "Profesor desactivado" });
  } catch (e) {
    next(e);
  }
}
