import { z } from "zod";
import { env } from "../config/env.js";
import type { studentIndicators } from "./lms.service.js";

/**
 * Contrato ML v3 (binario V6): el servicio devuelve P(deserción) y el nivel
 * operativo derivado de los umbrales centralizados (0.41 / 0.65).
 * El backend solo consume el nivel devuelto; no recalcula umbrales.
 */
export type MlPredictResult = {
  score: number;
  level: string;
  probability: number;
  probability_abandono?: number;
  model_name: string;
  factors?: { key: string; label: string; contribution: number }[];
  recommendation?: string;
  predicted_at?: string;
  input_data?: Record<string, unknown>;
  prediction_source?: "ml_model";
  // Contrato v3
  probabilidadDesercion?: number;
  nivelRiesgo?: string;
  modelo?: string;
  modelVersion?: string;
  datasetVersion?: string;
  dataMode?: string;
  contractVersion?: string;
  decisionThreshold?: number;
};

export function buildMlPayload(metrics: Awaited<ReturnType<typeof studentIndicators>>) {
  return {
    promedio_general: metrics.promedio_general, cursos_desaprobados: metrics.cursos_desaprobados,
    asistencia_general: metrics.asistencia_general, frecuencia_acceso_lms: metrics.frecuencia_acceso_lms,
    tiempo_interaccion_lms: metrics.tiempo_interaccion_lms, actividades_realizadas: metrics.actividades_realizadas,
    recursos_consultados: metrics.recursos_consultados,
  };
}

const mlResponseSchema = z.object({
  score: z.number().min(0).max(100),
  level: z.enum(["bajo", "medio", "alto"]),
  probability: z.number().min(0).max(1),
  probability_abandono: z.number().min(0).max(1),
  model_name: z.string().min(1).max(80),
  recommendation: z.string().max(4000),
  prediction_source: z.literal("ml_model"),
  predicted_at: z.string().optional(),
  factors: z.array(z.object({
    key: z.string().max(40),
    label: z.string().max(120),
    contribution: z.number().finite(),
  })).max(20),
  probabilidadDesercion: z.number().min(0).max(1).optional(),
  nivelRiesgo: z.enum(["bajo", "medio", "alto"]).optional(),
  modelVersion: z.string().max(60).optional(),
  datasetVersion: z.string().max(60).optional(),
  dataMode: z.enum(["synthetic_scientific", "real"]).optional(),
  contractVersion: z.string().max(20).optional(),
  decisionThreshold: z.number().min(0).max(1).optional(),
  // El servicio FastAPI publica el umbral en snake_case (contrato v3).
  decision_threshold: z.number().min(0).max(1).optional(),
}).transform((v) => ({ ...v, decisionThreshold: v.decisionThreshold ?? v.decision_threshold }));

export async function predictWithMl(body: ReturnType<typeof buildMlPayload>): Promise<MlPredictResult | null> {
  try {
    const res = await fetch(`${env.ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return mlResponseSchema.parse(await res.json());
  } catch {
    return null;
  }
}

export async function getMlMetrics() {
  try {
    const res = await fetch(`${env.ML_SERVICE_URL}/metrics`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Salud del servicio ML: modelo cargado, modo de datos y versión del dataset. */
export async function getMlHealth(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${env.ML_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
