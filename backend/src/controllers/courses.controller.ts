import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";
import { courseSchema } from "../validators/schemas.js";
import { getTeacherIdForUser } from "../utils/teacher.js";
import {
  buildCourseCodigoForSeccion,
  requireActiveSeccion,
} from "../utils/course-section.js";
import { getActiveAnioLectivoId } from "../utils/academic-period.js";
import { courseListInclude, mapCourseForApi } from "../utils/course-label.js";

export async function listCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const seccionId = req.query.seccionId as string | undefined;
    let profesorId = req.query.profesorId as string | undefined;

    if (req.user?.role === "docente") {
      const tid = await getTeacherIdForUser(req.user.sub);
      if (!tid) {
        return sendSuccess(res, { items: [] });
      }
      profesorId = tid;
    }

    const rows = await prisma.course.findMany({
      where: {
        activo: true,
        ...(seccionId ? { seccionId: toDbId(seccionId) } : {}),
        ...(profesorId ? { profesorId: toDbId(profesorId) } : {}),
      },
      include: courseListInclude,
    });
    const items = rows.map((c) => ({
      ...mapCourseForApi(c),
      id: idToString(c.id),
    }));
    sendSuccess(res, { items });
  } catch (e) {
    next(e);
  }
}

export async function createCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { codigo, nombre, profesorId, seccionId, cursoCatalogoId } = courseSchema.parse(req.body);

    if (req.user?.role === "docente") {
      const tid = await getTeacherIdForUser(req.user.sub);
      if (!tid || tid !== profesorId) {
        throw new AppError(403, "Solo puede crear cursos a su nombre");
      }
    }

    const seccion = await requireActiveSeccion(seccionId);
    const codigoFinal = buildCourseCodigoForSeccion(codigo, seccion);
    const anioLectivoId = await getActiveAnioLectivoId();

    let cursoId: bigint;
    if (cursoCatalogoId) {
      cursoId = toDbId(cursoCatalogoId);
    } else {
      const catalog = await prisma.cursoCatalogo.findFirst({
        where: { nombre },
      });
      if (!catalog) throw new AppError(400, "cursoCatalogoId requerido o catálogo no encontrado por nombre");
      cursoId = catalog.id;
    }

    const existing = await prisma.course.findUnique({ where: { codigo: codigoFinal } });
    if (existing) {
      throw new AppError(
        409,
        `Ya existe un curso con código ${codigoFinal} en ${seccion.grado.nombre} ${seccion.nombre}`,
      );
    }

    const dupSeccion = await prisma.course.findFirst({
      where: {
        seccionId: toDbId(seccionId),
        cursoId,
        profesorId: toDbId(profesorId),
        anioLectivoId,
        activo: true,
      },
    });
    if (dupSeccion) {
      throw new AppError(
        409,
        `Este docente ya tiene el curso "${nombre}" en ${seccion.grado.nombre} ${seccion.nombre}`,
      );
    }

    const course = await prisma.course.create({
      data: {
        codigo: codigoFinal,
        cursoId,
        profesorId: toDbId(profesorId),
        seccionId: toDbId(seccionId),
        anioLectivoId,
      },
      include: courseListInclude,
    });
    await logAudit({
      entidad: "Course",
      entidadId: course.id,
      accion: "CREATE",
      usuarioId: req.user?.sub,
    });
    sendCreated(res, { course: { ...mapCourseForApi(course), id: idToString(course.id) } });
  } catch (e) {
    next(e);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { profesorId, seccionId, activo } = req.body;
    if (seccionId) await requireActiveSeccion(seccionId);
    const course = await prisma.course.update({
      where: { id: paramBigIntId(req) },
      data: {
        profesorId: profesorId != null ? toDbId(profesorId) : undefined,
        seccionId: seccionId != null ? toDbId(seccionId) : undefined,
        activo,
      },
      include: courseListInclude,
    });
    await logAudit({
      entidad: "Course",
      entidadId: course.id,
      accion: "UPDATE",
      usuarioId: req.user?.sub,
    });
    sendSuccess(res, { course: { ...mapCourseForApi(course), id: idToString(course.id) } });
  } catch (e) {
    next(e);
  }
}

export async function deleteCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    const gradeCount = await prisma.grade.count({ where: { cursoOfertaId: id } });
    if (gradeCount > 0) {
      throw new AppError(
        409,
        "No se puede eliminar: el curso tiene notas registradas. Desactive la asignación docente.",
      );
    }
    await prisma.course.update({
      where: { id },
      data: { activo: false },
    });
    await logAudit({
      entidad: "Course",
      entidadId: id,
      accion: "DELETE",
      usuarioId: req.user?.sub,
    });
    sendSuccess(res, {}, "Curso desactivado");
  } catch (e) {
    next(e);
  }
}
