import { registerTeacher } from "../services/teacher-registration.service.js";
import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";
import {
  teacherAccountSchema,
  teacherSchema,
  updateTeacherSchema,
} from "../validators/schemas.js";
import {
  buildCourseCodigoForSeccion,
  requireActiveSeccion,
} from "../utils/course-section.js";
import { getActiveAnioLectivoId } from "../utils/academic-period.js";
import { getRolId } from "../utils/rol.js";
import { countActiveAssignmentsForTeacher } from "../services/teacher-assignment.service.js";
import { courseListInclude, courseDisplayName } from "../utils/course-label.js";

const courseSelect = {
  where: { activo: true as const },
  select: {
    id: true,
    codigo: true,
    seccionId: true,
    cursoCatalogo: { select: { nombre: true, codigo: true } },
  },
  orderBy: { codigo: "asc" as const },
};

const userSelect = { select: { id: true, email: true, activo: true } };

function mapTeacherCourses(
  courses: { id: bigint; codigo: string; seccionId: bigint; cursoCatalogo: { nombre: string; codigo: string } | null }[],
) {
  return courses.map((c) => ({
    id: idToString(c.id),
    codigo: c.codigo,
    nombre: courseDisplayName({ codigo: c.codigo, cursoCatalogo: c.cursoCatalogo }),
    seccionId: idToString(c.seccionId),
  }));
}

export async function listTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.teacher.findMany({
      where: { activo: true },
      include: {
        cursosOferta: courseSelect,
        usuario: userSelect,
        _count: { select: { cursosOferta: true } },
      },
      orderBy: { apellidos: "asc" },
    });
    const items = rows.map((t) => ({
      ...t,
      id: idToString(t.id),
      correo: t.email,
      courses: mapTeacherCourses(t.cursosOferta),
      user: t.usuario ? { ...t.usuario, id: idToString(t.usuario.id) } : null,
      userId: t.usuarioId ? idToString(t.usuarioId) : null,
    }));
    sendSuccess(res, { items });
  } catch (e) {
    next(e);
  }
}

export async function createTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const teacher = await registerTeacher(req.body, req.user!.sub, req.ip);
    sendCreated(res, { teacher: {
        ...teacher,
        id: idToString(teacher.id),
        correo: teacher.email,
        courses: mapTeacherCourses(teacher.cursosOferta),
        userId: teacher.usuarioId ? idToString(teacher.usuarioId) : null,
      }, });
  } catch (e) {
    next(e);
  }
}

export async function createTeacherAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { password } = teacherAccountSchema.parse(req.body);
    const id = paramBigIntId(req);

    const teacher = await prisma.teacher.findUnique({ where: { id }, include: { usuario: userSelect } });
    if (!teacher) throw new AppError(404, "Profesor no encontrado");
    if (teacher.usuarioId) throw new AppError(409, "Este docente ya tiene cuenta de acceso");

    const emailTaken = await prisma.user.findUnique({ where: { email: teacher.email } });
    if (emailTaken) throw new AppError(409, "El correo ya está registrado como usuario");

    const hash = await bcrypt.hash(password, 12);
    const updated = await prisma.$transaction(async (tx) => {
      const rolId = await getRolId("docente");
      const user = await tx.user.create({
        data: {
          email: teacher.email,
          passwordHash: hash,
          nombres: teacher.nombres,
          apellidos: teacher.apellidos,
          rolId,
        },
      });
      return tx.teacher.update({
        where: { id },
        data: { usuarioId: user.id },
        include: {
          cursosOferta: courseSelect,
          usuario: userSelect,
          _count: { select: { cursosOferta: true } },
        },
      });
    });

    await logAudit({
      entidad: "Teacher",
      entidadId: id,
      accion: "CREATE_ACCOUNT",
      usuarioId: req.user!.sub,
      teacherId: id,
      detalle: `Cuenta creada: ${teacher.email}`,
      ipAddress: req.ip ?? req.socket.remoteAddress ?? undefined,
    });
    sendCreated(res, { teacher: {
        ...updated,
        id: idToString(updated.id),
        correo: updated.email,
        courses: mapTeacherCourses(updated.cursosOferta),
      }, });
  } catch (e) {
    next(e);
  }
}

export async function updateTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateTeacherSchema.parse(req.body);
    const { correo, ...fields } = data;
    const id = paramBigIntId(req);

    const teacher = await prisma.$transaction(async (tx) => {
      const profile = await tx.teacher.update({
        where: { id },
        data: {
          nombres: fields.nombres,
          apellidos: fields.apellidos,
          especialidad: fields.especialidad,
          email: correo,
          telefono: fields.telefono === null ? null : fields.telefono,
          activo: fields.activo,
        },
      });



      if (profile.usuarioId) await tx.user.update({ where: { id: profile.usuarioId }, data: { email: correo, nombres: fields.nombres, apellidos: fields.apellidos, telefono: fields.telefono, activo: fields.activo } });
      return tx.teacher.findUniqueOrThrow({
        where: { id },
        include: {
          cursosOferta: courseSelect,
          usuario: userSelect,
          _count: { select: { cursosOferta: true } },
        },
      });
    });


    await logAudit({
      entidad: "Teacher",
      entidadId: teacher.id,
      accion: "UPDATE",
      usuarioId: req.user!.sub,
      teacherId: teacher.id,
    });
    sendSuccess(res, { teacher: {
        ...teacher,
        id: idToString(teacher.id),
        correo: teacher.email,
        courses: mapTeacherCourses(teacher.cursosOferta),
      }, });
  } catch (e) {
    next(e);
  }
}

export async function getTeacherDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { getTeacherWorkload } = await import("../services/teacher-assignment.service.js");
    const id = paramBigIntId(req);
    const teacher = await prisma.teacher.findFirst({
      where: { id, activo: true },
      include: {
        usuario: { select: { id: true, email: true, activo: true } },
      },
    });
    if (!teacher) throw new AppError(404, "Profesor no encontrado");
    const workload = await getTeacherWorkload(id);
    sendSuccess(res, {
      teacher: {
        id: idToString(teacher.id),
        codigo: teacher.codigo,
        nombres: teacher.nombres,
        apellidos: teacher.apellidos,
        especialidad: teacher.especialidad,
        correo: teacher.email,
        telefono: teacher.telefono,
        userId: teacher.usuarioId ? idToString(teacher.usuarioId) : null,
      },
      workload,
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    const activeAssignments = await countActiveAssignmentsForTeacher(id);
    if (activeAssignments > 0) {
      throw new AppError(
        409,
        "No se puede desactivar: el profesor tiene asignaciones activas. Desactive las asignaciones primero.",
      );
    }
    const teacher = await prisma.teacher.findUnique({ where: { id }, select: { usuarioId: true } });

    await prisma.$transaction(async (tx) => {
      await tx.course.updateMany({ where: { profesorId: id }, data: { activo: false } });
      await tx.teacher.update({ where: { id }, data: { activo: false } });
      if (teacher?.usuarioId) {
        await tx.user.update({ where: { id: teacher.usuarioId }, data: { activo: false } });
      }
    });

    await logAudit({
      entidad: "Teacher",
      entidadId: id,
      accion: "DEACTIVATE",
      usuarioId: req.user!.sub,
    });
    sendSuccess(res, {}, "Profesor desactivado");
  } catch (e) {
    next(e);
  }
}
