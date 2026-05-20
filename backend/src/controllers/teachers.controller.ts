import type { Request, Response, NextFunction } from "express";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramId } from "../utils/params.js";
import {
  teacherAccountSchema,
  teacherSchema,
  updateTeacherSchema,
} from "../validators/schemas.js";

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

const userSelect = { select: { id: true, email: true, activo: true } };

async function createCoursesForTeacher(
  tx: Prisma.TransactionClient,
  teacherId: string,
  cursos: { codigo: string; nombre: string; seccionId?: string; cursoCatalogoId?: string; periodo?: string }[],
) {
  for (const c of cursos) {
    const dup = await tx.course.findUnique({ where: { codigo: c.codigo } });
    if (dup) throw new AppError(409, `El curso con código ${c.codigo} ya existe`);
    await tx.course.create({
      data: {
        codigo: c.codigo,
        nombre: c.nombre,
        profesorId: teacherId,
        seccionId: c.seccionId ?? null,
        cursoCatalogoId: c.cursoCatalogoId ?? null,
        periodo: c.periodo ?? "2026",
      },
    });
  }
}

export async function listTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.teacher.findMany({
      where: { activo: true },
      include: {
        courses: courseInclude,
        user: userSelect,
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
    const { cursos, password, crearCuenta, ...teacherData } = data;

    const existing = await prisma.teacher.findUnique({ where: { codigo: teacherData.codigo } });
    if (existing) throw new AppError(409, "Código de profesor ya existe");

    const emailTaken = await prisma.user.findUnique({ where: { email: teacherData.correo } });
    if ((crearCuenta || password) && emailTaken) {
      throw new AppError(409, "Ya existe un usuario con ese correo");
    }

    const teacher = await prisma.$transaction(async (tx) => {
      let userId: string | undefined;

      if (crearCuenta || password) {
        const hash = await bcrypt.hash(password!, 12);
        const user = await tx.user.create({
          data: {
            email: teacherData.correo,
            passwordHash: hash,
            nombres: teacherData.nombres,
            apellidos: teacherData.apellidos,
            role: "docente",
          },
        });
        userId = user.id;
      }

      const created = await tx.teacher.create({
        data: {
          ...teacherData,
          telefono: teacherData.telefono ?? null,
          userId: userId ?? null,
        },
      });

      if (cursos?.length) await createCoursesForTeacher(tx, created.id, cursos);

      return tx.teacher.findUniqueOrThrow({
        where: { id: created.id },
        include: { courses: courseInclude, user: userSelect, _count: { select: { courses: true } } },
      });
    });

    await logAudit({
      entidad: "Teacher",
      entidadId: teacher.id,
      accion: "CREATE",
      usuarioId: req.user!.sub,
      teacherId: teacher.id,
      detalle: [
        cursos?.length ? `${cursos.length} curso(s)` : null,
        teacher.userId ? "cuenta docente" : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
    res.status(201).json({ ok: true, teacher });
  } catch (e) {
    next(e);
  }
}

export async function createTeacherAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { password } = teacherAccountSchema.parse(req.body);
    const id = paramId(req);

    const teacher = await prisma.teacher.findUnique({ where: { id }, include: { user: userSelect } });
    if (!teacher) throw new AppError(404, "Profesor no encontrado");
    if (teacher.userId) throw new AppError(409, "Este docente ya tiene cuenta de acceso");

    const emailTaken = await prisma.user.findUnique({ where: { email: teacher.correo } });
    if (emailTaken) throw new AppError(409, "El correo ya está registrado como usuario");

    const hash = await bcrypt.hash(password, 12);
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: teacher.correo,
          passwordHash: hash,
          nombres: teacher.nombres,
          apellidos: teacher.apellidos,
          role: "docente",
        },
      });
      return tx.teacher.update({
        where: { id },
        data: { userId: user.id },
        include: { courses: courseInclude, user: userSelect, _count: { select: { courses: true } } },
      });
    });

    await logAudit({
      entidad: "Teacher",
      entidadId: id,
      accion: "CREATE_ACCOUNT",
      usuarioId: req.user!.sub,
      teacherId: id,
    });
    res.status(201).json({ ok: true, teacher: updated });
  } catch (e) {
    next(e);
  }
}

export async function updateTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateTeacherSchema.parse(req.body);
    const { cursosNuevos, ...fields } = data;
    const id = paramId(req);

    const teacher = await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id },
        data: {
          ...fields,
          telefono: fields.telefono === null ? null : fields.telefono,
        },
      });

      if (cursosNuevos?.length) await createCoursesForTeacher(tx, id, cursosNuevos);

      return tx.teacher.findUniqueOrThrow({
        where: { id },
        include: { courses: courseInclude, user: userSelect, _count: { select: { courses: true } } },
      });
    });

    if (fields.correo && teacher.userId) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: { email: fields.correo },
      });
    }

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
    const teacher = await prisma.teacher.findUnique({ where: { id }, select: { userId: true } });

    await prisma.$transaction(async (tx) => {
      await tx.course.updateMany({ where: { profesorId: id }, data: { activo: false } });
      await tx.teacher.update({ where: { id }, data: { activo: false } });
      if (teacher?.userId) {
        await tx.user.update({ where: { id: teacher.userId }, data: { activo: false } });
      }
    });

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
