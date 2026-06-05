import type { LmsEngagement } from "@/types/academic";

export type LmsActividadInput = {
  actividadPct?: number;
  minutos?: number;
  conexiones?: number;
};

export type LmsIndicadorInput = {
  frecuenciaAcceso?: number;
  tiempoPlataforma?: number;
  tareasRatio?: number;
  participacion?: number;
} | null;

export function lmsCompositeScore(acts: LmsActividadInput[], ind?: LmsIndicadorInput): number {
  const parts: number[] = [];

  if (acts.length) {
    const avgPct = acts.reduce((s, a) => s + (a.actividadPct ?? 0), 0) / acts.length;
    parts.push(avgPct);
    const avgMin = acts.reduce((s, a) => s + (a.minutos ?? 0), 0) / acts.length;
    parts.push(Math.min(100, (avgMin / 180) * 100));
    const avgConn = acts.reduce((s, a) => s + (a.conexiones ?? 0), 0) / acts.length;
    parts.push(Math.min(100, avgConn * 8));
  }

  if (ind) {
    parts.push(Math.min(100, ind.frecuenciaAcceso ?? 0));
    parts.push(Math.min(100, (ind.tareasRatio ?? 0) * 100));
    parts.push(Math.min(100, ind.participacion ?? 0));
    parts.push(Math.min(100, (ind.tiempoPlataforma ?? 0) * 10));
  }

  if (!parts.length) return 0;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

export function deriveLmsEngagementLevel(acts: LmsActividadInput[], ind?: LmsIndicadorInput): LmsEngagement {
  const score = lmsCompositeScore(acts, ind);
  if (score >= 62) return "alto";
  if (score >= 38) return "medio";
  return "bajo";
}

export type LmsActivityTier = "alta" | "media" | "baja" | "sin";

export function lmsActivityTierFromLevel(level: LmsEngagement | string): LmsActivityTier {
  if (level === "alto" || level === "alta") return "alta";
  if (level === "medio" || level === "media") return "media";
  if (level === "bajo" || level === "baja") return "baja";
  return "sin";
}

export function lmsActivityTierFromMetrics(
  engagement: LmsEngagement | string | undefined,
  acts: LmsActividadInput[],
  ind?: LmsIndicadorInput,
): LmsActivityTier {
  const level = engagement ?? deriveLmsEngagementLevel(acts, ind);
  const score = lmsCompositeScore(acts, ind);
  if (score <= 0 && !ind && !acts.length) return "sin";
  return lmsActivityTierFromLevel(level);
}
