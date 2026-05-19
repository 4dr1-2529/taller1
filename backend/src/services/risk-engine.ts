/** Motor de riesgo local (fallback si ML service no responde) */

export type RiskLevel = "bajo" | "medio" | "alto";

export type MetricsInput = {
  promedioGeneral: number;
  asistenciaGeneral: number;
  lms: {
    actividadSemanalPct: number[];
    tareasEntregadas: number;
    tareasTotales: number;
  };
};

const WEIGHTS = { promedio: 0.32, asistencia: 0.28, lms: 0.22, tareas: 0.18 };

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 65) return "alto";
  if (score >= 41) return "medio";
  return "bajo";
}

export function computeLocalRisk(
  metrics: MetricsInput,
  estado: string,
): {
  score: number;
  level: RiskLevel;
  probability: number;
  factors: { key: string; label: string; contribution: number }[];
  modelName: string;
} {
  const activity = avg(metrics.lms.actividadSemanalPct);
  const taskPct =
    metrics.lms.tareasTotales > 0
      ? (metrics.lms.tareasEntregadas / metrics.lms.tareasTotales) * 100
      : 100;

  const rProm = metrics.promedioGeneral < 11 ? 58 : metrics.promedioGeneral < 13 ? 28 : 10;
  const rAsis = metrics.asistenciaGeneral < 75 ? 62 : metrics.asistenciaGeneral < 85 ? 35 : 12;
  const rLms = activity < 45 ? 72 : activity < 60 ? 45 : 15;
  const rTareas = taskPct < 55 ? 70 : taskPct < 80 ? 40 : 12;

  const estadoBoost = estado === "retirado" ? 15 : estado === "en_riesgo" ? 8 : 0;

  const factors = [
    { key: "bajo_promedio", label: "Promedio bajo", contribution: rProm * WEIGHTS.promedio },
    { key: "baja_asistencia", label: "Asistencia baja", contribution: rAsis * WEIGHTS.asistencia },
    { key: "baja_actividad_lms", label: "LMS bajo", contribution: rLms * WEIGHTS.lms },
    { key: "tareas_incompletas", label: "Tareas pendientes", contribution: rTareas * WEIGHTS.tareas },
  ].sort((a, b) => b.contribution - a.contribution);

  const score = Math.min(
    100,
    Math.round((factors.reduce((s, f) => s + f.contribution, 0) + estadoBoost) * 10) / 10,
  );

  return {
    score,
    level: levelFromScore(score),
    probability: score / 100,
    factors,
    modelName: "local-ensemble-rules",
  };
}
