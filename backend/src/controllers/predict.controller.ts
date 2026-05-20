import type { Request, Response, NextFunction } from "express";
import { RiskLevel } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { predictSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { computeLocalRisk } from "../services/risk-engine.js";
import { predictWithMl } from "../services/ml-client.js";
import { recommendationsForFactor } from "../services/recommendations.js";

export async function predict(req: Request, res: Response, next: NextFunction) {
  try {
    const body = predictSchema.parse(req.body);
    const student = body.studentId
      ? await prisma.student.findUnique({
          where: { id: body.studentId },
          include: { lmsActivities: { orderBy: { semana: "desc" }, take: 1 } },
        })
      : null;

    if (body.studentId && !student) throw new AppError(404, "Estudiante no encontrado");

    const metrics = body.metrics ?? {
      promedioGeneral: student!.promedioGeneral,
      asistenciaGeneral: student!.asistenciaGeneral,
      lms: {
        actividadSemanalPct: student!.lmsActivities.map((a) => a.actividadPct),
        tareasEntregadas: student!.lmsActivities[0]?.tareasEntregadas ?? 5,
        tareasTotales: student!.lmsActivities[0]?.tareasTotales ?? 10,
      },
    };

    const estado = body.estado ?? student?.estado ?? "activo";

    const mlInput = {
      promedioGeneral: metrics.promedioGeneral,
      asistenciaGeneral: metrics.asistenciaGeneral,
      lms: {
        actividadSemanalPct: metrics.lms.actividadSemanalPct,
        tareasEntregadas: metrics.lms.tareasEntregadas,
        tareasTotales: metrics.lms.tareasTotales,
      },
    };

    const ml = await predictWithMl(mlInput, estado);
    const local = computeLocalRisk(mlInput, estado);

    const result = ml
      ? {
          score: ml.score,
          level: ml.level as "bajo" | "medio" | "alto",
          probability: ml.probability,
          factors: ml.factors ?? local.factors,
          modelName: ml.model_name,
        }
      : local;

    if (student) {
      const level = result.level as RiskLevel;
      await prisma.prediction.create({
        data: {
          studentId: student.id,
          score: result.score,
          level,
          probability: result.probability,
          modelVersion: "2.0",
          modelName: result.modelName,
          factorsJson: JSON.stringify(result.factors),
        },
      });

      if (result.level !== "bajo") {
        const top = result.factors[0];
        await prisma.alert.create({
          data: {
            studentId: student.id,
            titulo: `Alerta temprana — riesgo ${result.level}`,
            descripcion: `Score: ${result.score}. Factor: ${top?.label}`,
            factorKey: top?.key,
            level,
          },
        });
        const recs = recommendationsForFactor(top?.key ?? "general");
        for (const r of recs) {
          await prisma.aiRecommendation.create({
            data: {
              studentId: student.id,
              factorKey: top?.key ?? "general",
              titulo: r.titulo,
              detalle: r.detalle,
            },
          });
        }
      }
    }

    res.json({ ok: true, prediction: result, source: ml ? "machine-learning" : "local-engine" });
  } catch (e) {
    next(e);
  }
}

export async function dashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const where = user.role === "estudiante"
      ? { id: user.sub }
      : { activo: true };

    const [totalStudents, openAlerts, recentPredictions, avgRisk] = await Promise.all([
      prisma.student.count({ where }),
      prisma.alert.count({ where: { status: "abierta" } }),
      prisma.prediction.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { score: true, level: true, createdAt: true },
      }),
      prisma.prediction.aggregate({ _avg: { score: true } }),
    ]);

    const byLevel = { bajo: 0, medio: 0, alto: 0 };
    for (const p of recentPredictions) byLevel[p.level]++;

    res.json({
      ok: true,
      kpis: {
        totalStudents,
        openAlerts,
        avgRisk: Math.round((avgRisk._avg.score ?? 0) * 10) / 10,
        byLevel,
      },
    });
  } catch (e) {
    next(e);
  }
}
