import { z } from "zod";
import { env } from "../config/env.js";
import type { studentIndicators } from "./lms.service.js";

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
  prediction_source?: "ml_model" | "rule_fallback" | "heuristic_fallback";
};

export function buildMlPayload(metrics: Awaited<ReturnType<typeof studentIndicators>>) {
  return {
    promedio_general: metrics.promedio_general, cursos_desaprobados: metrics.cursos_desaprobados,
    asistencia_general: metrics.asistencia_general, frecuencia_acceso_lms: metrics.frecuencia_acceso_lms,
    tiempo_interaccion_lms: metrics.tiempo_interaccion_lms, actividades_realizadas: metrics.actividades_realizadas,
    recursos_consultados: metrics.recursos_consultados,
  };
}

export async function predictWithMl(body: ReturnType<typeof buildMlPayload>): Promise<MlPredictResult | null> {
  try {
    const res = await fetch(`${env.ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return z.object({
      score: z.number().min(0).max(100), level: z.enum(["bajo", "medio", "alto"]),
      probability: z.number().min(0).max(1), probability_abandono: z.number().min(0).max(1),
      model_name: z.string().min(1).max(80), recommendation: z.string().max(4000),
      prediction_source: z.literal("ml_model"), predicted_at: z.string().optional(),
      factors: z.array(z.object({ key: z.string().max(40), label: z.string().max(120), contribution: z.number().finite() })).max(20),
    }).parse(await res.json());
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
