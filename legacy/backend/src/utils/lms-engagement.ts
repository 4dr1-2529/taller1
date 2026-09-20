export type LmsEngagementLevel = "alto" | "medio" | "bajo";

export type LmsActividadRow = {
  actividadPct: unknown;
  minutos?: unknown;
  conexiones?: unknown;
  horasPlataforma?: unknown;
};

export type LmsIndicadorRow = {
  frecuenciaAcceso?: unknown;
  tiempoPlataforma?: unknown;
  tareasRatio?: unknown;
  participacion?: unknown;
} | null;

/** Score compuesto 0–100 a partir de actividad semanal e indicadores LMS. */
export function lmsCompositeScore(acts: LmsActividadRow[], ind?: LmsIndicadorRow): number {
  const parts: number[] = [];

  if (acts.length) {
    const avgPct = acts.reduce((s, a) => s + Number(a.actividadPct), 0) / acts.length;
    parts.push(avgPct);
    const avgMin = acts.reduce((s, a) => s + Number(a.minutos ?? 0), 0) / acts.length;
    parts.push(Math.min(100, (avgMin / 180) * 100));
    const avgConn = acts.reduce((s, a) => s + Number(a.conexiones ?? 0), 0) / acts.length;
    parts.push(Math.min(100, avgConn * 8));
  }

  if (ind) {
    parts.push(Math.min(100, Number(ind.frecuenciaAcceso ?? 0)));
    parts.push(Math.min(100, Number(ind.tareasRatio ?? 0) * 100));
    parts.push(Math.min(100, Number(ind.participacion ?? 0)));
    parts.push(Math.min(100, Number(ind.tiempoPlataforma ?? 0) * 10));
  }

  if (!parts.length) return 0;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

export function deriveLmsEngagement(acts: LmsActividadRow[], ind?: LmsIndicadorRow): LmsEngagementLevel {
  const score = lmsCompositeScore(acts, ind);
  if (score >= 62) return "alto";
  if (score >= 38) return "medio";
  return "bajo";
}

export function lmsEngagementLabel(level: LmsEngagementLevel): string {
  if (level === "alto") return "Alto";
  if (level === "medio") return "Medio";
  return "Bajo";
}
