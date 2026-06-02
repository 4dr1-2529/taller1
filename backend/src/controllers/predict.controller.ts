import type { Request, Response, NextFunction } from "express";
import type { NivelRiesgo } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { predictSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { computeLocalRisk } from "../services/risk-engine.js";
import { buildMlPayload, predictWithMl } from "../services/ml-client.js";
import { recommendationsForFactor } from "../services/recommendations.js";
import { assertStudentInScope, resolveStudentScope } from "../utils/student-scope.js";
import { buildPredictionApiPayload } from "../utils/prediction-format.js";
import { buildDashboardAnalytics } from "../services/dashboard-analytics.service.js";
import { toDbId, idToString } from "../utils/ids.js";

function alertPriority(level: NivelRiesgo): "alta" | "media" | "baja" {
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

async function countFailedCourses(studentId: bigint): Promise<number> {
  return prisma.grade.count({
    where: { studentId, nota: { lt: 11 } },
  });
}

export async function predict(req: Request, res: Response, next: NextFunction) {
  try {
    const body = predictSchema.parse(req.body);
    const user = req.user!;

    const student = body.studentId
      ? await prisma.student.findUnique({
          where: { id: toDbId(body.studentId) },
          include: {
            lmsActividades: { orderBy: { anioSemana: "asc" } },
            seccion: { include: { grado: { include: { nivel: true } } } },
          },
        })
      : null;

    if (body.studentId) {
      if (!student) throw new AppError(404, "Estudiante no encontrado");
      await assertStudentInScope(user, idToString(student.id));
    }

    const lmsRows = student?.lmsActividades ?? [];
    const latestLms = lmsRows[lmsRows.length - 1];
    const metrics = body.metrics ?? {
      promedioGeneral: Number(student!.promedioGeneral),
      asistenciaGeneral: Number(student!.asistenciaGeneral),
      lms: {
        actividadSemanalPct: lmsRows.map((a) => Number(a.actividadPct)),
        tareasEntregadas: 5,
        tareasTotales: 10,
      },
    };

    const estado = body.estado ?? student?.estado ?? "activo";
    const cursosDesaprobados = student ? await countFailedCourses(student.id) : 0;
    const tiempoPlataforma = latestLms ? Number(latestLms.horasPlataforma) : 4;
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
          modelName: ml.model_name ?? "ml-service",
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
      const nivelRiesgo = result.level as NivelRiesgo;
      const factorRows = (result.factors ?? []).map((f) => ({
        factorKey: String(f.key),
        etiqueta: f.label,
        contribucion: f.contribution,
      }));

      savedPrediction = await prisma.prediction.create({
        data: {
          studentId: student.id,
          score: result.score,
          nivelRiesgo,
          probabilidad: result.probabilityAbandono,
          probabilidadAbandono: result.probabilityAbandono,
          factores: factorRows.length ? { createMany: { data: factorRows } } : undefined,
        },
        include: { factores: true },
      });

      if (nivelRiesgo !== "bajo") {
        const priority = alertPriority(nivelRiesgo);
        const top = result.factors[0];
        const openDuplicate = await prisma.alert.findFirst({
          where: {
            studentId: student.id,
            estado: { in: ["nueva", "en_seguimiento"] },
            nivelRiesgo,
          },
        });

        if (!openDuplicate) {
          alertCreated = await prisma.alert.create({
            data: {
              studentId: student.id,
              prediccionId: savedPrediction.id,
              titulo: `[${priority.toUpperCase()}] Alerta temprana — riesgo ${nivelRiesgo}`,
              descripcion: [
                `Score predictivo: ${result.score}/100.`,
                `Probabilidad de abandono: ${(result.probabilityAbandono * 100).toFixed(1)}%.`,
                `Motivo principal: ${top?.label ?? "Indicadores compuestos"}.`,
              ].join(" "),
              nivelRiesgo,
              score: result.score,
              probabilidad: result.probabilityAbandono,
              recomendacion: result.recommendation,
              estado: "nueva",
              factores: top
                ? {
                    createMany: {
                      data: [
                        {
                          factorKey: String(top.key),
                          etiqueta: top.label,
                          contribucion: top.contribution,
                        },
                      ],
                    },
                  }
                : undefined,
            },
          });

          const recs = recommendationsForFactor(top?.key ?? "general");
          for (const r of recs) {
            await prisma.aiRecommendation.create({
              data: {
                studentId: student.id,
                prediccionId: savedPrediction.id,
                factorKey: top ? String(top.key) : "general",
                titulo: r.titulo,
                detalle: r.detalle,
              },
            });
          }

          const staff = await prisma.user.findMany({
            where: { activo: true, rol: { codigo: { in: ["admin", "docente"] } } },
            select: { id: true },
            take: 20,
          });
          for (const u of staff) {
            await prisma.notification.create({
              data: {
                usuarioId: u.id,
                tipo: "alerta",
                titulo: `Alerta ${nivelRiesgo} — ${student.nombres} ${student.apellidos}`,
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
      id: savedPrediction ? idToString(savedPrediction.id) : undefined,
      studentId: student ? idToString(student.id) : undefined,
    });

    res.json({
      ok: true,
      prediction: predictionPayload,
      alert: alertCreated
        ? { ...alertCreated, id: idToString(alertCreated.id) }
        : null,
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
