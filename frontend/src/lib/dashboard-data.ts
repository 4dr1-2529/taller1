import { globalRiskScore } from "@/lib/aggregates";
import type { RiskHistoryPoint, Student } from "@/types/academic";

const ROLE_GREETING: Record<string, string> = {
  admin: "Panel del director — riesgo de deserción institucional",
  docente: "Seguimiento de tus estudiantes y cursos",
  estudiante: "Tu rendimiento y nivel de riesgo",
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
