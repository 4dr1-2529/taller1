import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { alertStatusSchema } from "../validators/schemas.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import { logAudit } from "../utils/audit.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/errorHandler.js";

function parsePriority(titulo: string): "alta" | "media" | "baja" {
  if (titulo.includes("[ALTA]")) return "alta";
  if (titulo.includes("[MEDIA]")) return "media";
  return "baja";
}

export async function listAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveStudentScope(req.user!);
    const level = req.query.level as string | undefined;

    const items = await prisma.alert.findMany({
      where: {
        status: { in: ["abierta", "en_seguimiento"] },
        student: scope,
        ...(level && ["bajo", "medio", "alto"].includes(level) ? { level: level as "bajo" | "medio" | "alto" } : {}),
      },
      include: {
        student: {
          select: { id: true, codigo: true, nombres: true, apellidos: true, seccionId: true },
        },
      },
      orderBy: [{ level: "desc" }, { createdAt: "desc" }],
    });

    const enriched = items.map((a) => ({
      ...a,
      prioridad: parsePriority(a.titulo),
    }));

    res.json({ ok: true, items: enriched, total: enriched.length });
  } catch (e) {
    next(e);
  }
}

export async function patchAlertStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = alertStatusSchema.parse(req.body);
    const id = paramId(req);
    const scope = await resolveStudentScope(req.user!);

    const existing = await prisma.alert.findFirst({
      where: { id, student: scope },
      include: { student: true },
    });
    if (!existing) throw new AppError(404, "Alerta no encontrada o sin permiso");

    const item = await prisma.alert.update({
      where: { id },
      data: { status },
      include: { student: true },
    });

    await logAudit({
      entidad: "Alert",
      entidadId: item.id,
      accion: "UPDATE_STATUS",
      detalle: status,
      studentId: item.studentId,
      usuarioId: req.user?.sub,
    });

    res.json({
      ok: true,
      item: { ...item, prioridad: parsePriority(item.titulo) },
    });
  } catch (e) {
    next(e);
  }
}
