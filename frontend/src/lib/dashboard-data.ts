import {
  attachPredictions,
  averageAttendance,
  averageLmsParticipation,
  earlyAlertCount,
  globalRiskScore,
  rankingAtRisk,
} from "@/lib/aggregates";
import type { RiskHistoryPoint, Student } from "@/types/academic";

export type TimelineEvent = {
  id: string;
  time: string;
  title: string;
  detail: string;
  tone: "danger" | "warning" | "info" | "success";
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  tone: "rose" | "amber" | "violet" | "cyan" | "emerald";
  timestamp: string;
};

export type AiInsight = {
  id: string;
  priority: "alta" | "media";
  title: string;
  body: string;
  metric?: string;
};

const ROLE_GREETING: Record<string, string> = {
  admin: "Vista ejecutiva del colegio",
  docente: "Seguimiento de tus estudiantes",
  tutor: "Monitoreo de tutoría y alertas",
  psicologo: "Casos prioritarios de bienestar",
  estudiante: "Tu progreso académico",
  apoderado: "Seguimiento familiar",
};

export function dashboardGreeting(role: string) {
  return ROLE_GREETING[role] ?? ROLE_GREETING.admin;
}

/** Serie de 6 meses anclada al riesgo actual (variación suave para lectura visual). */
export function buildRiskHistorySeries(students: Student[]): RiskHistoryPoint[] {
  if (!students.length) return [];
  const current = globalRiskScore(students);
  const now = new Date();
  const points: RiskHistoryPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const periodo = d.toLocaleDateString("es-PE", { month: "short", year: "2-digit" });
    const drift = 1 - i * 0.018;
    const riesgoGlobal =
      i === 0 ? current : Math.min(100, Math.max(0, Math.round(current * drift * 10) / 10));
    points.push({ periodo, riesgoGlobal });
  }
  return points;
}

export function buildTimelineEvents(students: Student[]): TimelineEvent[] {
  const withPred = attachPredictions(students);
  const events: TimelineEvent[] = [];
  const now = new Date();

  withPred
    .filter((s) => s.prediction.level === "alto")
    .slice(0, 3)
    .forEach((s, i) => {
      const t = new Date(now);
      t.setHours(t.getHours() - (i + 1) * 2);
      events.push({
        id: `risk-${s.id}`,
        time: t.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
        title: `Riesgo alto: ${s.nombres} ${s.apellidos}`,
        detail: `Score ${Math.round(s.prediction.score)} — revisar asistencia y LMS`,
        tone: "danger",
      });
    });

  withPred
    .filter((s) => (s.metrics.lms.actividadSemanalPct.at(-1) ?? 100) < 45)
    .slice(0, 2)
    .forEach((s, i) => {
      events.push({
        id: `lms-${s.id}`,
        time: `Hace ${i + 2} h`,
        title: `LMS bajo — ${s.nombres}`,
        detail: `Actividad ${s.metrics.lms.actividadSemanalPct.at(-1) ?? 0}% esta semana`,
        tone: "warning",
      });
    });

  if (events.length === 0 && withPred.length > 0) {
    events.push({
      id: "stable",
      time: "Hoy",
      title: "Cohorte estable",
      detail: "Sin alertas críticas en las últimas horas",
      tone: "success",
    });
  }

  events.push({
    id: "model",
    time: "Sistema",
    title: "Motor ensemble activo",
    detail: "Predicción con factores académicos, asistencia y LMS",
    tone: "info",
  });

  return events.slice(0, 6);
}

export function buildActivityStream(students: Student[]): ActivityItem[] {
  const withPred = attachPredictions(students);
  const items: ActivityItem[] = [];

  rankingAtRisk(students, 4).forEach((s, i) => {
    items.push({
      id: `rank-${s.id}`,
      title: `${s.nombres} ${s.apellidos}`,
      detail: `Score de deserción ${Math.round(s.prediction.score)} · ${s.prediction.level}`,
      tone: s.prediction.level === "alto" ? "rose" : "amber",
      timestamp: `Hace ${i + 1} min`,
    });
  });

  const lowAtt = withPred.filter((s) => s.metrics.asistenciaGeneral < 75).slice(0, 2);
  lowAtt.forEach((s) => {
    items.push({
      id: `att-${s.id}`,
      title: "Asistencia en descenso",
      detail: `${s.nombres} — ${s.metrics.asistenciaGeneral}% general`,
      tone: "cyan",
      timestamp: "Reciente",
    });
  });

  items.push({
    id: "sync",
    title: "Analítica actualizada",
    detail: `${students.length} estudiantes · ${earlyAlertCount(students)} en alerta temprana`,
    tone: "violet",
    timestamp: "Ahora",
  });

  return items.slice(0, 7);
}

export function buildAiInsights(students: Student[]): AiInsight[] {
  if (!students.length) {
    return [
      {
        id: "empty",
        priority: "media",
        title: "Sin datos de cohorte",
        body: "Registre estudiantes y matrículas para activar recomendaciones automáticas.",
      },
    ];
  }

  const att = averageAttendance(students);
  const lms = averageLmsParticipation(students);
  const alerts = earlyAlertCount(students);
  const insights: AiInsight[] = [];

  if (alerts >= 3) {
    insights.push({
      id: "alerts",
      priority: "alta",
      title: "Intervención prioritaria",
      body: `${alerts} estudiantes en riesgo medio o alto. Coordine tutoría y psicología esta semana.`,
      metric: `${alerts} alertas`,
    });
  }

  if (att < 80) {
    insights.push({
      id: "att",
      priority: "alta",
      title: "Asistencia institucional baja",
      body: `Promedio ${att}%. Refuerce seguimiento con apoderados en cursos críticos.`,
      metric: `${att}%`,
    });
  }

  if (lms < 55) {
    insights.push({
      id: "lms",
      priority: "media",
      title: "Engagement LMS débil",
      body: `Participación media ${lms}%. Revise entregas y tiempo en plataforma por sección.`,
      metric: `${lms}%`,
    });
  }

  const high = attachPredictions(students).filter((s) => s.prediction.level === "alto").length;
  if (high > 0) {
    insights.push({
      id: "high",
      priority: "alta",
      title: "Concentración de riesgo alto",
      body: `${high} estudiante(s) en nivel alto. Use el módulo de predicción para factores explicables.`,
      metric: `${high} casos`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "ok",
      priority: "media",
      title: "Indicadores dentro de rango",
      body: "La cohorte muestra métricas estables. Mantenga monitoreo semanal del ensemble.",
      metric: "Estable",
    });
  }

  return insights.slice(0, 4);
}
