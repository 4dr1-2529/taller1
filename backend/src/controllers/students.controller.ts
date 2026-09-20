import { studentIndicators } from "../services/lms.service.js";
import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { registerStudent } from "../services/student-registration.service.js";
import { prisma } from "../utils/prisma.js";
import { updateStudentSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";

export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const q = String(req.query.q ?? "").trim();
    const seccionId = req.query.seccionId as string | undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(800, Number(req.query.limit) || 200);
    const skip = (page - 1) * limit;

    const scope = await resolveStudentScope(req.user!);
    const where: Record<string, unknown> = { AND: [scope] };
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

          predicciones: { orderBy: { createdAt: "desc" }, take: 1 },
          alertas: { where: { estado: { in: ["nueva", "en_seguimiento"] } } },
        },
      }),
      prisma.student.count({ where }),
    ]);

    const items = await Promise.all(rows.map(async (s) => ({
      ...s,
      id: idToString(s.id),
      seccionId: s.seccionId ? idToString(s.seccionId) : null,
      indicators: await studentIndicators(s.id),
      predictions: s.predicciones,
      alerts: s.alertas,
    })));

    sendSuccess(res, { items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    sendCreated(res, await registerStudent(req.body, req.user!.sub, req.ip));
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

        recomendaciones: { orderBy: { createdAt: "desc" }, take: 5 },
        apoderados: { include: { apoderado: true } },
      },
    });
    if (!student) throw new AppError(404, "Estudiante no encontrado");
    sendSuccess(res, { student: {
        ...student,
        id: idToString(student.id),
        grades: student.calificaciones,
        indicators: await studentIndicators(student.id),
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
    const student = await prisma.$transaction(async tx => {
      const student = await tx.student.update({ where: { id }, data: { nombres: data.nombres, apellidos: data.apellidos, dni: data.dni, email: data.correo, telefono: data.telefono, estado: data.estado } });
      if (student.usuarioId) await tx.user.update({ where: { id: student.usuarioId }, data: { nombres: data.nombres, apellidos: data.apellidos, dni: data.dni, email: data.correo, telefono: data.telefono } });
      await tx.auditLog.create({ data: { entidad: "Student", entidadId: String(id), accion: "UPDATE", usuarioId: BigInt(req.user!.sub), estudianteId: id, ipAddress: req.ip } });
      return student;
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
    await prisma.$transaction(async tx => {
      const student = await tx.student.update({ where: { id }, data: { activo: false } });
      if (student.usuarioId) {
        await tx.user.update({ where: { id: student.usuarioId }, data: { activo: false } });
        await tx.session.updateMany({ where: { usuarioId: student.usuarioId }, data: { revocada: true } });
      }
    });
    await logAudit({
      entidad: "Student",
      entidadId: id,
      accion: "DEACTIVATE",
      usuarioId: req.user?.sub,
      ipAddress: req.ip,
    });
    sendSuccess(res, {}, "Estudiante desactivado");
  } catch (e) {
    next(e);
  }
}
