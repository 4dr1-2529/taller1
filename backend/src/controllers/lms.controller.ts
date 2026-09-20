import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import { assertLmsCourse, recordLmsEvent, studentIndicators } from "../services/lms.service.js";
import { assertStudentInScope } from "../utils/student-scope.js";

const common = z.object({
  courseId: z.string().regex(/^[1-9]\d*$/), titulo: z.string().trim().min(2).max(150), descripcion: z.string().max(4000).optional(),
});
const materialSchema = common.extend({ tipo: z.enum(["pdf", "documento", "presentacion", "enlace", "guia", "repaso"]), url: z.string().url().max(1000).refine(s => /^https?:\/\//i.test(s), "Use una URL HTTP o HTTPS") }).strict();
const activitySchema = common.extend({ tipo: z.enum(["practica", "lectura", "repaso", "material_obligatorio", "otra"]) }).strict();
const courseIdSchema = z.coerce.string().regex(/^[1-9]\d*$/);

export async function listLearning(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = BigInt(courseIdSchema.parse(req.query.courseId));
    await assertLmsCourse(req.user!, courseId);
    const resources = await prisma.courseResource.findMany({ where: { courseId, activo: true }, orderBy: { createdAt: "desc" } });
    const activities = await prisma.academicActivity.findMany({ where: { courseId, activo: true }, include: { progress: { where: { student: { usuarioId: BigInt(req.user!.sub) } } } }, orderBy: { createdAt: "desc" } });
    sendSuccess(res, { resources, activities });
  } catch (e) { next(e); }
}

export async function publishMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const data = materialSchema.parse(req.body);
    const courseId = BigInt(data.courseId);
    await assertLmsCourse(req.user!, courseId);
    const teacher = await prisma.teacher.findFirstOrThrow({ where: { usuarioId: BigInt(req.user!.sub), activo: true } });
    const item = await prisma.$transaction(async tx => {
      const item = await tx.courseResource.create({ data: { ...data, courseId, profesorId: teacher.id } });
      await tx.auditLog.create({ data: { entidad: "Material", entidadId: String(item.id), accion: "CREATE", usuarioId: BigInt(req.user!.sub), ipAddress: req.ip } });
      return item;
    });
    sendCreated(res, { item });
  } catch (e) { next(e); }
}

export async function publishActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const data = activitySchema.parse(req.body);
    const courseId = BigInt(data.courseId);
    await assertLmsCourse(req.user!, courseId);
    const teacher = await prisma.teacher.findFirstOrThrow({ where: { usuarioId: BigInt(req.user!.sub), activo: true } });
    const item = await prisma.$transaction(async tx => {
      const item = await tx.academicActivity.create({ data: { ...data, courseId, profesorId: teacher.id } });
      await tx.auditLog.create({ data: { entidad: "Actividad", entidadId: String(item.id), accion: "CREATE", usuarioId: BigInt(req.user!.sub), ipAddress: req.ip } });
      return item;
    });
    sendCreated(res, { item });
  } catch (e) { next(e); }
}

export async function accessMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.courseResource.findFirst({ where: { id: BigInt(courseIdSchema.parse(req.params.id)), activo: true } });
    if (!item) throw new AppError(404, "Material no encontrado");
    await assertLmsCourse(req.user!, item.courseId);
    await recordLmsEvent(req.user!, "recurso", { courseId: item.courseId, resourceId: item.id });
    sendSuccess(res, { item });
  } catch (e) { next(e); }
}

export async function progressActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { estado } = z.object({ estado: z.enum(["iniciada", "completada"]) }).strict().parse(req.body);
    const activityId = BigInt(courseIdSchema.parse(req.params.id));
    const item = await prisma.academicActivity.findFirst({ where: { id: activityId, activo: true } });
    if (!item) throw new AppError(404, "Actividad no encontrada");
    await assertLmsCourse(req.user!, item.courseId);
    const student = await prisma.student.findFirstOrThrow({ where: { usuarioId: BigInt(req.user!.sub), activo: true } });
    const old = await prisma.activityProgress.findUnique({ where: { studentId_activityId: { studentId: student.id, activityId } } });
    if (old?.estado === "completada") return sendSuccess(res, { progress: old });
    if (estado === "completada" && !old?.startedAt) throw new AppError(409, "Inicie primero la actividad");
    const progress = await prisma.activityProgress.upsert({ where: { studentId_activityId: { studentId: student.id, activityId } }, create: { studentId: student.id, activityId, estado, startedAt: new Date() }, update: { estado, completedAt: estado === "completada" ? new Date() : undefined } });
    await recordLmsEvent(req.user!, "actividad", { courseId: item.courseId, activityId });
    sendSuccess(res, { progress });
  } catch (e) { next(e); }
}

export async function courseAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = z.object({ courseId: courseIdSchema }).strict().parse(req.body);
    await assertLmsCourse(req.user!, BigInt(courseId));
    await recordLmsEvent(req.user!, "curso", { courseId: BigInt(courseId) });
    sendSuccess(res, {});
  } catch (e) { next(e); }
}

export async function getIndicators(req: Request, res: Response, next: NextFunction) {
  try {
    const id = courseIdSchema.parse(req.params.id);
    await assertStudentInScope(req.user!, id);
    sendSuccess(res, { indicators: await studentIndicators(BigInt(id)) });
  } catch (e) { next(e); }
}
