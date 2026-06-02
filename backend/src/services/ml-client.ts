import { env } from "../config/env.js";
import type { MetricsInput } from "./risk-engine.js";

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
};

/** Construye payload extendido para el servicio ML (variables tesis). */
export function buildMlPayload(metrics: MetricsInput, estado: string, extra?: {
  cursosDesaprobados?: number;
  tiempoPlataforma?: number;
  usoForos?: number;
  disminucionActividad?: number;
}) {
  const actividad = metrics.lms.actividadSemanalPct;
  const frecuencia = actividad.length
    ? actividad.reduce((a, b) => a + b, 0) / actividad.length
    : 50;
  const disminucion =
    extra?.disminucionActividad ??
    (actividad.length >= 2 ? Math.max(0, actividad[0] - actividad[actividad.length - 1]) : 0);

  let estadoStr = "activo";
  if (estado === "en_riesgo" || estado === "en riesgo") estadoStr = "en_riesgo";
  else if (estado === "retirado") estadoStr = "retirado";

  return {
    promedio_general: metrics.promedioGeneral,
    cursos_desaprobados: extra?.cursosDesaprobados ?? 0,
    asistencia_general: metrics.asistenciaGeneral,
    frecuencia_acceso_lms: frecuencia,
    actividad_lms_prom: frecuencia,
    tiempo_plataforma: extra?.tiempoPlataforma ?? 4,
    tareas_ratio:
      metrics.lms.tareasTotales > 0
        ? metrics.lms.tareasEntregadas / metrics.lms.tareasTotales
        : 1,
    participacion_actividades: frecuencia,
    uso_foros: extra?.usoForos ?? 0.5,
    disminucion_actividad: disminucion,
    estado: estadoStr,
  };
}

export async function predictWithMl(
  metrics: MetricsInput,
  estado: string,
  extra?: Parameters<typeof buildMlPayload>[2],
): Promise<MlPredictResult | null> {
  try {
    const body = buildMlPayload(metrics, estado, extra);
    const res = await fetch(`${env.ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as MlPredictResult;
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
