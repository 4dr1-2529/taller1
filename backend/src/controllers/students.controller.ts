import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { studentSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";

export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const q = String(req.query.q ?? "").toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 100);
    const skip = (page - 1) * limit;

    const where = q
      ? {
          OR: [
            { nombres: { contains: q } },
            { apellidos: { contains: q } },
            { codigo: { contains: q } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { apellidos: "asc" },
        include: {
          lmsActivities: { orderBy: { semana: "asc" } },
          predictions: { orderBy: { createdAt: "desc" }, take: 1 },
          alerts: { where: { status: "abierta" } },
        },
      }),
      prisma.student.count({ where }),
    ]);

    res.json({ ok: true, items, total, page, pages: Math.ceil(total / limit) });
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
        nivel: data.nivel,
        correo: data.correo,
        telefono: data.telefono,
        estado: data.estado ?? "activo",
        promedioGeneral: data.promedioGeneral ?? 12,
        asistenciaGeneral: data.asistenciaGeneral ?? 80,
        lmsEngagement: data.lmsEngagement ?? "medio",
      },
    });

    await logAudit({
      entidad: "Student",
      entidadId: student.id,
      accion: "CREATE",
      studentId: student.id,
      ipAddress: req.ip,
    });

    res.status(201).json({ ok: true, student });
  } catch (e) {
    next(e);
  }
}

export async function getStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        enrollments: { include: { course: true } },
        predictions: { orderBy: { createdAt: "desc" }, take: 10 },
        lmsActivities: { orderBy: { semana: "asc" } },
        recommendations: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!student) throw new AppError(404, "Estudiante no encontrado");
    res.json({ ok: true, student });
  } catch (e) {
    next(e);
  }
}
