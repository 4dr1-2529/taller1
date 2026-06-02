import type { Request, Response, NextFunction } from "express";
import { RiskLevel } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { predictSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { computeLocalRisk } from "../services/risk-engine.js";
import { buildMlPayload, predictWithMl } from "../services/ml-client.js";
import { recommendationsForFactor } from "../services/recommendations.js";
import { assertStudentInScope, resolveStudentScope } from "../utils/student-scope.js";
import { buildPredictionApiPayload } from "../utils/prediction-format.js";
import { buildDashboardAnalytics } from "../services/dashboard-analytics.service.js";

function alertPriority(level: RiskLevel): "alta" | "media" | "baja" {
  if (level === "alto") return "alta";
  if (level === "medio") return "media";
  return "baja";
}

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

/** Cuenta cursos desaprobados (nota < 11) del estudiante. */
async function countFailedCourses(studentId: string): Promise<number> {
  const failed = await prisma.grade.count({
    where: { studentId, nota: { lt: 11 } },
  });
  return failed;
}

export async function predict(req: Request, res: Response, next: NextFunction) {
  try {
    const body = predictSchema.parse(req.body);
    const user = req.user!;

    const student = body.studentId
      ? await prisma.student.findUnique({
          where: { id: body.studentId },
          include: {
            lmsActivities: { orderBy: { semana: "asc" } },
            seccion: { include: { grado: { include: { nivel: true } } } },
          },
        })
      : null;

    if (body.studentId) {
      if (!student) throw new AppError(404, "Estudiante no encontrado");
      await assertStudentInScope(user, student.id);
    }

    const lmsRows = student?.lmsActivities ?? [];
    const latestLms = lmsRows[lmsRows.length - 1];
    const metrics = body.metrics ?? {
      promedioGeneral: student!.promedioGeneral,
      asistenciaGeneral: student!.asistenciaGeneral,
      lms: {
        actividadSemanalPct: lmsRows.map((a) => a.actividadPct),
        tareasEntregadas: latestLms?.tareasEntregadas ?? 5,
        tareasTotales: latestLms?.tareasTotales ?? 10,
      },
    };

    const estado = body.estado ?? student?.estado ?? "activo";
    const cursosDesaprobados = student ? await countFailedCourses(student.id) : 0;
    const tiempoPlataforma = latestLms?.horasPlataforma ?? 4;
    const usoForos = latestLms ? Math.min(1, latestLms.conexiones / 20) : 0.5;
    const actividad = metrics.lms.actividadSemanalPct;
    const disminucion =
      actividad.length >= 2 ? Math.max(0, actividad[0] - actividad[actividad.length - 1]) : 0;

    const mlExtra = { cursosDesaprobados, tiempoPlataforma, usoForos, disminucionActividad: disminucion };
    const ml = await predictWithMl(metrics, estado, mlExtra);
    const local = computeLocalRisk(metrics, estado);

    const result = ml
      ? {
          score: ml.score,
          level: ml.level as "bajo" | "medio" | "alto",
          probability: ml.probability_abandono ?? ml.probability,
          probabilityAbandono: ml.probability_abandono ?? ml.probability,
          factors: ml.factors ?? local.factors,
          modelName: ml.model_name,
          recommendation: buildRecommendation(ml.level, ml.factors ?? [], ml.recommendation),
          predictedAt: ml.predicted_at ?? new Date().toISOString(),
          inputData: ml.input_data ?? buildMlPayload(metrics, estado, mlExtra),
        }
      : {
          ...local,
          probabilityAbandono: local.probability,
          recommendation: buildRecommendation(local.level, local.factors),
          predictedAt: new Date().toISOString(),
          inputData: buildMlPayload(metrics, estado, mlExtra),
        };

    let savedPrediction = null;
    let alertCreated = null;

    if (student) {
      const level = result.level as RiskLevel;
      const factorsJson = JSON.stringify(result.factors);
      const metaJson = JSON.stringify({
        inputData: result.inputData,
        recommendation: result.recommendation,
        source: ml ? "machine-learning" : "local-engine",
        probabilityAbandono: result.probabilityAbandono,
      });

      savedPrediction = await prisma.prediction.create({
        data: {
          studentId: student.id,
          score: result.score,
          level,
          probability: result.probabilityAbandono,
          modelVersion: "2.1",
          modelName: result.modelName,
          factorsJson,
          metaJson,
        },
      });

      if (level !== "bajo") {
        const priority = alertPriority(level);
        const top = result.factors[0];
        const openDuplicate = await prisma.alert.findFirst({
          where: {
            studentId: student.id,
            status: { in: ["abierta", "en_seguimiento"] },
            level,
          },
        });

        if (!openDuplicate) {
          alertCreated = await prisma.alert.create({
            data: {
              studentId: student.id,
              titulo: `[${priority.toUpperCase()}] Alerta temprana — riesgo ${level}`,
              descripcion: [
                `Score predictivo: ${result.score}/100.`,
                `Motivo principal: ${top?.label ?? "Indicadores compuestos"}.`,
                `Recomendación: ${result.recommendation}`,
              ].join(" "),
              factorKey: top?.key ?? "general",
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

          // Notificar tutores/psicólogos/admin
          const staff = await prisma.user.findMany({
            where: { role: { in: ["admin", "tutor", "psicologo"] }, activo: true },
            select: { id: true },
            take: 20,
          });
          for (const u of staff) {
            await prisma.notification.create({
              data: {
                userId: u.id,
                tipo: "alerta",
                titulo: `Alerta ${level} — ${student.nombres} ${student.apellidos}`,
                mensaje: result.recommendation.slice(0, 500),
                leida: false,
              },
            });
          }
        }
      }
    }

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
      id: savedPrediction?.id,
      studentId: student?.id,
    });

    res.json({
      ok: true,
      prediction: predictionPayload,
      alert: alertCreated,
      source: ml ? "machine-learning" : "local-engine",
    });
  } catch (e) {
    next(e);
  }
}

export async function dashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveStudentScope(req.user!);
    const analytics = await buildDashboardAnalytics(scope);
    res.json({ ok: true, ...analytics });
  } catch (e) {
    next(e);
  }
}
