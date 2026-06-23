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

async function createCoursesForTeacher(
  tx: Prisma.TransactionClient,
  teacherId: bigint,
  cursos: { codigo: string; nombre: string; seccionId: string; cursoCatalogoId?: string; periodo?: string }[],
) {
  const anioLectivoId = await getActiveAnioLectivoId();
  for (const c of cursos) {
    const seccion = await requireActiveSeccion(c.seccionId, tx);
    const codigoFinal = buildCourseCodigoForSeccion(c.codigo, seccion);

    const dup = await tx.course.findUnique({ where: { codigo: codigoFinal } });
    if (dup) {
      throw new AppError(
        409,
        `El curso ${codigoFinal} ya existe en ${seccion.grado.nombre} ${seccion.nombre}`,
      );
    }

    let cursoId: bigint;
    if (c.cursoCatalogoId) {
      cursoId = toDbId(c.cursoCatalogoId);
    } else {
      const catalog = await tx.cursoCatalogo.findFirst({ where: { nombre: c.nombre } });
      if (!catalog) throw new AppError(400, `Catálogo no encontrado: ${c.nombre}`);
      cursoId = catalog.id;
    }

    const dupSeccion = await tx.course.findFirst({
      where: {
        seccionId: toDbId(c.seccionId),
        cursoId,
        profesorId: teacherId,
        anioLectivoId,
        activo: true,
      },
    });
    if (dupSeccion) {
      throw new AppError(
        409,
        `Ya existe "${c.nombre}" en ${seccion.grado.nombre} ${seccion.nombre}`,
      );
    }

    await tx.course.create({
      data: {
        codigo: codigoFinal,
        cursoId,
        profesorId: teacherId,
        seccionId: toDbId(c.seccionId),
        anioLectivoId,
      },
    });
  }
}

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
    const data = teacherSchema.parse(req.body);
    const { cursos, password, crearCuenta, correo, ...teacherData } = data;

    const existing = await prisma.teacher.findUnique({ where: { codigo: teacherData.codigo } });
    if (existing) throw new AppError(409, "Código de profesor ya existe");

    const emailTaken = await prisma.user.findUnique({ where: { email: correo } });
    if ((crearCuenta || password) && emailTaken) {
      throw new AppError(409, "Ya existe un usuario con ese correo");
    }

    const teacher = await prisma.$transaction(async (tx) => {
      let usuarioId: bigint | undefined;

      if (crearCuenta || password) {
        const hash = await bcrypt.hash(password!, 12);
        const rolId = await getRolId("docente");
        const user = await tx.user.create({
          data: {
            email: correo,
            passwordHash: hash,
            nombres: teacherData.nombres,
            apellidos: teacherData.apellidos,
            rolId,
          },
        });
        usuarioId = user.id;
      }

      const created = await tx.teacher.create({
        data: {
          codigo: teacherData.codigo,
          nombres: teacherData.nombres,
          apellidos: teacherData.apellidos,
          especialidad: teacherData.especialidad,
          email: correo,
          telefono: teacherData.telefono ?? null,
          usuarioId: usuarioId ?? null,
        },
      });

      if (cursos?.length) await createCoursesForTeacher(tx, created.id, cursos);

      return tx.teacher.findUniqueOrThrow({
        where: { id: created.id },
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
      accion: "CREATE",
      usuarioId: req.user!.sub,
      teacherId: teacher.id,
      detalle: [
        cursos?.length ? `${cursos.length} curso(s)` : null,
        teacher.usuarioId ? "cuenta docente" : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
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
    const { cursosNuevos, correo, ...fields } = data;
    const id = paramBigIntId(req);

    const teacher = await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
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

      if (cursosNuevos?.length) await createCoursesForTeacher(tx, id, cursosNuevos);

      return tx.teacher.findUniqueOrThrow({
        where: { id },
        include: {
          cursosOferta: courseSelect,
          usuario: userSelect,
          _count: { select: { cursosOferta: true } },
        },
      });
    });

    if (correo && teacher.usuarioId) {
      await prisma.user.update({
        where: { id: teacher.usuarioId },
        data: { email: correo },
      });
    }

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
      accion: "DELETE",
      usuarioId: req.user!.sub,
    });
    sendSuccess(res, {}, "Profesor desactivado");
  } catch (e) {
    next(e);
  }
}
