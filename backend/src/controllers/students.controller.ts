import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { studentSchema, updateStudentSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import { deriveLmsEngagement } from "../utils/lms-engagement.js";

export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const q = String(req.query.q ?? "").trim();
    const seccionId = req.query.seccionId as string | undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(800, Number(req.query.limit) || 200);
    const skip = (page - 1) * limit;

    const scope = await resolveStudentScope(req.user!);
    const where: Record<string, unknown> = { ...scope };
    if (seccionId) where.seccionId = toDbId(seccionId);
    if (q) {
      where.OR = [
        { nombres: { contains: q } },
        { apellidos: { contains: q } },
        { codigo: { contains: q } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { apellidos: "asc" },
        include: {
          seccion: { include: { grado: { include: { nivel: true } } } },
          lmsActividades: { orderBy: { anioSemana: "asc" } },
          lmsIndicadores: { take: 1, orderBy: { id: "desc" } },
          predicciones: { orderBy: { createdAt: "desc" }, take: 1 },
          alertas: { where: { estado: { in: ["nueva", "en_seguimiento"] } } },
        },
      }),
      prisma.student.count({ where }),
    ]);

    const items = rows.map((s) => ({
      ...s,
      id: idToString(s.id),
      seccionId: s.seccionId ? idToString(s.seccionId) : null,
      lmsActivities: s.lmsActividades,
      lmsEngagement: deriveLmsEngagement(s.lmsActividades, s.lmsIndicadores[0] ?? null),
      lmsIndicador: s.lmsIndicadores[0] ?? null,
      predictions: s.predicciones,
      alerts: s.alertas,
    }));

    sendSuccess(res, { items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = studentSchema.parse(req.body);
    const exists = await prisma.student.findUnique({ where: { codigo: data.codigo } });
    if (exists) throw new AppError(409, "Código de estudiante duplicado");

    const student = await prisma.student.create({
      data: {
        codigo: data.codigo,
        nombres: data.nombres,
        apellidos: data.apellidos,
        seccionId: toDbId(data.seccionId),
        dni: data.dni,
        email: data.correo || null,
        telefono: data.telefono,
        estado: data.estado ?? "activo",
        promedioGeneral: data.promedioGeneral ?? 0,
        asistenciaGeneral: data.asistenciaGeneral ?? 0,
        fechaIngreso: new Date(),
      },
      include: { seccion: { include: { grado: { include: { nivel: true } } } } },
    });

    await logAudit({
      entidad: "Student",
      entidadId: student.id,
      accion: "CREATE",
      usuarioId: req.user?.sub,
      studentId: student.id,
      ipAddress: req.ip,
    });

    sendCreated(res, { student: { ...student, id: idToString(student.id) } });
  } catch (e) {
    next(e);
  }
}

export async function getStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    await assertStudentInScope(req.user!, idToString(id));
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        seccion: { include: { grado: { include: { nivel: true } } } },
        calificaciones: { include: { cursoOferta: { include: { cursoCatalogo: true } }, periodo: true } },
        predicciones: { orderBy: { createdAt: "desc" }, take: 10, include: { factores: true } },
        lmsActividades: { orderBy: { anioSemana: "asc" } },
        recomendaciones: { orderBy: { createdAt: "desc" }, take: 5 },
        apoderados: { include: { apoderado: true } },
      },
    });
    if (!student) throw new AppError(404, "Estudiante no encontrado");
    sendSuccess(res, { student: {
        ...student,
        id: idToString(student.id),
        grades: student.calificaciones,
        lmsActivities: student.lmsActividades,
        predictions: student.predicciones,
        recommendations: student.recomendaciones,
      }, });
  } catch (e) {
    next(e);
  }
}

export async function updateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    await assertStudentInScope(req.user!, idToString(id));
    const data = updateStudentSchema.parse(req.body);
    const student = await prisma.student.update({
      where: { id },
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        seccionId: data.seccionId != null ? toDbId(data.seccionId) : undefined,
        email: data.correo,
        telefono: data.telefono,
        estado: data.estado,
        promedioGeneral: data.promedioGeneral,
        asistenciaGeneral: data.asistenciaGeneral,
      },
    });
    await logAudit({
      entidad: "Student",
      entidadId: student.id,
      accion: "UPDATE",
      usuarioId: req.user?.sub,
      studentId: student.id,
      ipAddress: req.ip,
    });
    sendSuccess(res, { student: { ...student, id: idToString(student.id) } });
  } catch (e) {
    next(e);
  }
}

export async function deleteStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    await assertStudentInScope(req.user!, idToString(id));
    await prisma.student.update({
      where: { id },
      data: { activo: false },
    });
    await logAudit({
      entidad: "Student",
      entidadId: id,
      accion: "DELETE",
      usuarioId: req.user?.sub,
      ipAddress: req.ip,
    });
    sendSuccess(res, {}, "Estudiante desactivado");
  } catch (e) {
    next(e);
  }
}
