import { persistPrediction } from "../services/prediction-persistence.service.js";
import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import type { NivelRiesgo } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { predictSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { studentIndicators } from "../services/lms.service.js";
import { buildMlPayload, predictWithMl } from "../services/ml-client.js";
import { recommendationsForFactor } from "../services/recommendations.js";
import { assertStudentInScope, resolveStudentScope } from "../utils/student-scope.js";
import { buildPredictionApiPayload } from "../utils/prediction-format.js";
import { buildDashboardAnalytics } from "../services/dashboard-analytics.service.js";
import { toDbId, idToString } from "../utils/ids.js";

function buildRecommendation(level: string, factors: { label: string }[], mlRec?: string): string {
  if (mlRec) return mlRec;
  const top = factors[0]?.label ?? "seguimiento general";
  if (level === "alto") {
    return `Intervención prioritaria por ${top}. Coordinar tutoría y familia en 7 días.`;
  }
  if (level === "medio") {
    return `Seguimiento preventivo: ${top}. Revisión quincenal en LMS y asistencia.`;
  }
  return "Riesgo bajo. Mantener monitoreo rutinario.";
}

export async function predict(req: Request, res: Response, next: NextFunction) {
  try {
    const body = predictSchema.parse(req.body);
    const user = req.user!;

    const student = body.studentId
      ? await prisma.student.findUnique({
          where: { id: toDbId(body.studentId) },
          include: {

            seccion: { include: { grado: { include: { nivel: true } } } },
          },
        })
      : null;

    if (body.studentId) {
      if (!student) throw new AppError(404, "Estudiante no encontrado");
      await assertStudentInScope(user, idToString(student.id));
    }

    const metrics = await studentIndicators(student!.id);
    if (metrics.promedio_general === null || metrics.asistencia_general === null) throw new AppError(409, "Datos académicos insuficientes para predecir");
    const payload = buildMlPayload(metrics);
    const ml = await predictWithMl(payload);
    if (!ml) throw new AppError(503, "Modelo experimental V6 no disponible. No se genera riesgo ficticio.");
    const probability = ml.probabilidadDesercion ?? ml.probability_abandono ?? ml.probability;
    const level = (ml.nivelRiesgo ?? ml.level) as NivelRiesgo;
    const result = {
      score: ml.score, level,
      probability,
      probabilityAbandono: probability,
      factors: ml.factors ?? [],
      modelName: ml.modelo ?? ml.model_name,
      predictionSource: "ml_model" as const,
      recommendation: buildRecommendation(level, ml.factors ?? [], ml.recommendation),
      predictedAt: ml.predicted_at ?? new Date().toISOString(),
      inputData: payload,
      modelVersion: ml.modelVersion,
      datasetVersion: ml.datasetVersion,
      dataMode: ml.dataMode,
      contractVersion: ml.contractVersion ?? "2026-v3",
      decisionThreshold: ml.decisionThreshold,
    };

    const { prediction: savedPrediction, alert: alertCreated } = await persistPrediction(student!.id, result, user.sub, req.ip);

    const predictionPayload = buildPredictionApiPayload({
      score: result.score,
      level: result.level as "bajo" | "medio" | "alto",
      probability: result.probabilityAbandono,
      probabilityAbandono: result.probabilityAbandono,
      factors: result.factors,
      modelName: result.modelName,
      recommendation: result.recommendation,
      predictedAt: result.predictedAt,
      inputData: result.inputData as Record<string, unknown>,
      modelVersion: result.modelVersion,
      datasetVersion: result.datasetVersion,
      dataMode: result.dataMode,
      contractVersion: result.contractVersion,
      decisionThreshold: result.decisionThreshold,
      id: savedPrediction ? idToString(savedPrediction.id) : undefined,
      studentId: student ? idToString(student.id) : undefined,
    });

    sendSuccess(res, { prediction: predictionPayload,
      alert: alertCreated
        ? { ...alertCreated, id: idToString(alertCreated.id) }
        : null,
      source: "machine-learning", });
  } catch (e) {
    next(e);
  }
}

export async function dashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveStudentScope(req.user!);
    const analytics = await buildDashboardAnalytics(scope);
    sendSuccess(res, { ...analytics });
  } catch (e) {
    next(e);
  }
}
