import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramId } from "../utils/params.js";


export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { titulo, tipo, archivoPath, metaJson } = req.body;
    const report = await prisma.report.create({
      data: { titulo, tipo, generadoPor: req.user!.sub, archivoPath, metaJson: metaJson ? JSON.stringify(metaJson) : null },
    });
    await logAudit({ entidad: "Report", entidadId: report.id, accion: "CREATE", usuarioId: req.user!.sub, detalle: tipo });
    res.status(201).json({ ok: true, report });
  } catch (e) {
    next(e);
  }
}

export async function deleteReport(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.report.delete({ where: { id: paramId(req) } });
    res.json({ ok: true, message: "Reporte eliminado" });
  } catch (e) {
    next(e);
  }
}

export async function saveDashboardSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const { periodo, riesgoGlobal, totalEstudiantes, alertasAbiertas, metaJson } = req.body;
    const snapshot = await prisma.dashboardSnapshot.upsert({
      where: { periodo },
      create: { periodo, riesgoGlobal, totalEstudiantes, alertasAbiertas, metaJson: metaJson ? JSON.stringify(metaJson) : null },
      update: { riesgoGlobal, totalEstudiantes, alertasAbiertas, metaJson: metaJson ? JSON.stringify(metaJson) : null },
    });
    res.json({ ok: true, snapshot });
  } catch (e) {
    next(e);
  }
}

export async function getDashboardSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const snapshot = await prisma.dashboardSnapshot.findUnique({ where: { periodo: paramId(req, 'periodo') } });
    if (!snapshot) throw new AppError(404, "Snapshot no encontrado");
    res.json({ ok: true, snapshot });
  } catch (e) {
    next(e);
  }
}

export async function listStudentRisks(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, periodo } = req.query;
    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId as string;
    if (periodo) where.periodo = periodo as string;
    const items = await prisma.studentRisk.findMany({
      where,
      include: { student: { select: { nombres: true, apellidos: true, codigo: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ ok: true, items });
  } catch (e) {
    next(e);
  }
}

export async function createStudentRisk(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, score, level, periodo } = req.body;
    const record = await prisma.studentRisk.create({
      data: { studentId, score, level, periodo: periodo ?? "2026-I" },
    });
    res.status(201).json({ ok: true, record });
  } catch (e) {
    next(e);
  }
}

export async function applyRecommendation(req: Request, res: Response, next: NextFunction) {
  try {
    const rec = await prisma.aiRecommendation.findUnique({ where: { id: paramId(req) } });
    if (!rec) throw new AppError(404, "Recomendación no encontrada");
    const updated = await prisma.aiRecommendation.update({
      where: { id: paramId(req) },
      data: { aplicada: true },
    });
    await logAudit({ entidad: "AiRecommendation", entidadId: updated.id, accion: "APPLY", usuarioId: req.user!.sub, studentId: rec.studentId });
    res.json({ ok: true, recommendation: updated });
  } catch (e) {
    next(e);
  }
}
