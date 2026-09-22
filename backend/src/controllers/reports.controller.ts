import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import type { NivelRiesgo } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import { getActiveAnioLectivoId, resolvePeriodoByParam } from "../utils/academic-period.js";

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.report.findMany({ where: req.user!.role === "admin" ? {} : { generadoPor: BigInt(req.user!.sub) }, orderBy: { createdAt: "desc" }, take: 50 });
    const items = rows.map((r) => ({ ...r, id: idToString(r.id) }));
    sendSuccess(res, { items });
  } catch (e) {
    next(e);
  }
}

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { titulo, tipo, archivoPath, metaJson } = req.body;
    const report = await prisma.report.create({
      data: {
        titulo,
        tipo,
        generadoPor: toDbId(req.user!.sub),
        rutaArchivo: archivoPath ?? null,
        metaJson: metaJson ?? null,
      },
    });
    await logAudit({
      entidad: "Report",
      entidadId: report.id,
      accion: "CREATE",
      usuarioId: req.user!.sub,
      detalle: tipo,
    });
    sendCreated(res, { report: { ...report, id: idToString(report.id) } });
  } catch (e) {
    next(e);
  }
}

export async function deleteReport(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.report.delete({ where: { id: paramBigIntId(req) } });
    sendSuccess(res, {}, "Reporte eliminado");
  } catch (e) {
    next(e);
  }
}

export async function saveDashboardSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const { periodoId, periodo, totalEstudiantes, alertasAbiertas, metaJson } = req.body;
    const anioLectivoId = await getActiveAnioLectivoId();
    const pid =
      periodoId != null
        ? await resolvePeriodoByParam(String(periodoId))
        : periodo
          ? await resolvePeriodoByParam(String(periodo))
          : null;

    const riesgoBajo = Number(req.body.riesgoBajo ?? req.body.byLevel?.bajo ?? 0);
    const riesgoMedio = Number(req.body.riesgoMedio ?? req.body.byLevel?.medio ?? 0);
    const riesgoAlto = Number(req.body.riesgoAlto ?? req.body.byLevel?.alto ?? 0);

    const snapshot = await prisma.dashboardSnapshot.create({
      data: {
        anioLectivoId,
        periodoId: pid,
        totalEstudiantes: totalEstudiantes ?? 0,
        riesgoBajo,
        riesgoMedio,
        riesgoAlto,
        alertasAbiertas: alertasAbiertas ?? 0,
        metaJson: metaJson ?? null,
      },
    });
    sendSuccess(res, { snapshot: { ...snapshot, id: idToString(snapshot.id) } });
  } catch (e) {
    next(e);
  }
}

export async function getDashboardSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const periodoParam = String(req.params.periodo ?? "");
    const periodoId = await resolvePeriodoByParam(periodoParam);
    const snapshot = await prisma.dashboardSnapshot.findFirst({
      where: { periodoId },
      orderBy: { createdAt: "desc" },
    });
    if (!snapshot) throw new AppError(404, "Snapshot no encontrado");
    sendSuccess(res, { snapshot: { ...snapshot, id: idToString(snapshot.id) } });
  } catch (e) {
    next(e);
  }
}

/** Reemplaza StudentRisk: última predicción por estudiante. */
export async function listStudentRisks(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.query.studentId as string | undefined;
    const scope = await resolveStudentScope(req.user!);
    if (studentId) await assertStudentInScope(req.user!, studentId);

    const students = await prisma.student.findMany({
      where: {
        ...scope,
        ...(studentId ? { id: toDbId(studentId) } : {}),
        OR: [
          { predicciones: { some: { nivelRiesgo: { in: ["medio", "alto"] } } } },
        ],
      },
      include: {
        predicciones: { orderBy: { createdAt: "desc" }, take: 1, include: { factores: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const items = students.map((s) => {
      const pred = s.predicciones[0];
      return {
        id: pred ? idToString(pred.id) : idToString(s.id),
        studentId: idToString(s.id),
        score: pred ? Number(pred.score) : null,
        level: pred?.nivelRiesgo ?? "bajo",
        periodo: null,
        createdAt: pred?.createdAt ?? s.updatedAt,
        student: { nombres: s.nombres, apellidos: s.apellidos, codigo: s.codigo },
        factors: pred?.factores.map((f) => ({
          key: f.factorKey,
          label: f.etiqueta,
          contribution: Number(f.contribucion),
        })),
      };
    });

    sendSuccess(res, { items });
  } catch (e) {
    next(e);
  }
}

export async function applyRecommendation(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    const rec = await prisma.aiRecommendation.findUnique({ where: { id } });
    if (!rec) throw new AppError(404, "Recomendación no encontrada");
    await assertStudentInScope(req.user!, String(rec.studentId));
    const updated = await prisma.aiRecommendation.update({
      where: { id },
      data: { aplicada: true },
    });
    await logAudit({
      entidad: "AiRecommendation",
      entidadId: updated.id,
      accion: "APPLY",
      usuarioId: req.user!.sub,
      studentId: rec.studentId,
    });
    sendSuccess(res, { recommendation: { ...updated, id: idToString(updated.id) }, });
  } catch (e) {
    next(e);
  }
}
