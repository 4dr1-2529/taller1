import { env } from "../config/env.js";
import type { MetricsInput } from "./risk-engine.js";

export async function predictWithMl(metrics: MetricsInput, estado: string) {
  try {
    const res = await fetch(`${env.ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promedio_general: metrics.promedioGeneral,
        asistencia_general: metrics.asistenciaGeneral,
        actividad_lms_prom: metrics.lms.actividadSemanalPct.length
          ? metrics.lms.actividadSemanalPct.reduce((a, b) => a + b, 0) /
            metrics.lms.actividadSemanalPct.length
          : 50,
        tareas_ratio:
          metrics.lms.tareasTotales > 0
            ? metrics.lms.tareasEntregadas / metrics.lms.tareasTotales
            : 1,
        estado: estado === "en_riesgo" ? 1 : estado === "retirado" ? 2 : 0,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      score: number;
      level: string;
      probability: number;
      model_name: string;
      factors?: { key: string; label: string; contribution: number }[];
    };
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
