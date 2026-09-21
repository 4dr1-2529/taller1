import type { RiskHistoryPoint } from "@/types/academic";

const ROLE_GREETING: Record<string, string> = {
  admin: "Panel del director — riesgo de deserción institucional",
  docente: "Seguimiento de tus estudiantes y cursos",
  estudiante: "Tu rendimiento y nivel de riesgo",
};

export function dashboardGreeting(role: string) {
  return ROLE_GREETING[role] ?? ROLE_GREETING.admin;
}

/** Sin serie local: la tendencia ML proviene de Prediction persistida vía API. */
export function buildRiskHistorySeries(): RiskHistoryPoint[] {
  return [];
}
