export type RiskLevel = "bajo" | "medio" | "alto";
export type FactorKey = "bajo_promedio" | "baja_asistencia" | "baja_actividad_lms" | "tareas_incompletas";
export type StudentStatus = "activo" | "en_riesgo" | "retirado" | "en riesgo";

export type RiskFactor = {
  key: FactorKey | string;
  label: string;
  contribution: number;
  severity: "leve" | "moderada" | "alta";
};

export type PredictionOutput = {
  score: number;
  level: RiskLevel;
  probability: number;
  factors: RiskFactor[];
  modelName: string;
  meta?: Record<string, unknown>;
};

export type MetricsInput = {
  promedioGeneral: number;
  asistenciaGeneral: number;
  lms: {
    actividadSemanalPct: number[];
    tareasEntregadas: number;
    tareasTotales: number;
  };
};

const RISK_THRESHOLDS = { alto: 65, medio: 41 } as const;
const WEIGHTS = { promedio: 0.32, asistencia: 0.28, lms: 0.22, tareas: 0.18 } as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function avgActivity(metrics: MetricsInput) {
  const arr = metrics.lms.actividadSemanalPct;
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function taskCompletion(metrics: MetricsInput) {
  const { tareasEntregadas, tareasTotales } = metrics.lms;
  if (tareasTotales <= 0) return 100;
  return (tareasEntregadas / tareasTotales) * 100;
}

function riskFromPromedio(promedio: number) {
  if (promedio >= 14) return 8;
  if (promedio >= 12) return 22;
  if (promedio >= 11) return 38;
  if (promedio >= 9) return 58;
  return 78;
}

function riskFromAsistencia(pct: number) {
  if (pct >= 92) return 6;
  if (pct >= 85) return 20;
  if (pct >= 75) return 40;
  if (pct >= 65) return 62;
  return 82;
}

function riskFromLms(activityAvg: number) {
  if (activityAvg >= 75) return 10;
  if (activityAvg >= 60) return 28;
  if (activityAvg >= 45) return 48;
  if (activityAvg >= 30) return 68;
  return 85;
}

function riskFromTareas(completionPct: number) {
  if (completionPct >= 90) return 8;
  if (completionPct >= 75) return 25;
  if (completionPct >= 55) return 48;
  if (completionPct >= 35) return 68;
  return 86;
}

function severityFromContribution(c: number): RiskFactor["severity"] {
  if (c >= 22) return "alta";
  if (c >= 12) return "moderada";
  return "leve";
}

function levelFromScore(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.alto) return "alto";
  if (score >= RISK_THRESHOLDS.medio) return "medio";
  return "bajo";
}

function estadoBoost(estado: StudentStatus) {
  if (estado === "retirado") return 18;
  if (estado === "en_riesgo" || estado === "en riesgo") return 10;
  return 0;
}

function buildFactors(metrics: MetricsInput, estado: StudentStatus): RiskFactor[] {
  const activity = avgActivity(metrics);
  const tasks = taskCompletion(metrics);
  const raw: { key: FactorKey; label: string; rawRisk: number }[] = [
    { key: "bajo_promedio", label: "Promedio general bajo", rawRisk: riskFromPromedio(metrics.promedioGeneral) },
    { key: "baja_asistencia", label: "Asistencia insuficiente", rawRisk: riskFromAsistencia(metrics.asistenciaGeneral) },
    { key: "baja_actividad_lms", label: "Baja participación LMS", rawRisk: riskFromLms(activity) },
    { key: "tareas_incompletas", label: "Tareas pendientes / incompletas", rawRisk: riskFromTareas(tasks) },
  ];
  const factors: RiskFactor[] = raw.map((item) => {
    const weightKey =
      item.key === "bajo_promedio" ? "promedio"
      : item.key === "baja_asistencia" ? "asistencia"
      : item.key === "baja_actividad_lms" ? "lms"
      : "tareas";
    const contribution = item.rawRisk * WEIGHTS[weightKey];
    return { key: item.key, label: item.label, contribution, severity: severityFromContribution(contribution) };
  });
  const boost = estadoBoost(estado);
  if (boost > 0) {
    factors.push({
      key: "estado_administrativo",
      label: `Estado administrativo: ${estado}`,
      contribution: boost,
      severity: estado === "retirado" ? "alta" : "moderada",
    });
  }
  return factors.sort((a, b) => b.contribution - a.contribution);
}

export function computeLocalRisk(metrics: MetricsInput, estado: string): PredictionOutput {
  const st = estado as StudentStatus;
  const factors = buildFactors(metrics, st);
  const score = clamp(Math.round(factors.reduce((acc, f) => acc + f.contribution, 0) * 10) / 10, 0, 100);
  return {
    score,
    level: levelFromScore(score),
    probability: score / 100,
    factors: factors.slice(0, 4),
    modelName: "ensemble-rules-v2",
    meta: { pesos: { ...WEIGHTS }, umbrales: { ...RISK_THRESHOLDS } },
  };
}
