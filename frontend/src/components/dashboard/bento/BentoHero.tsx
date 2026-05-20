"use client";

import { ArrowDownRight, ArrowUpRight, Minus, AlertTriangle, Sparkles } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { StudentWithPrediction } from "@/lib/aggregates";

type BentoHeroProps = {
  greeting: string;
  globalRisk: number;
  alerts: number;
  healthScore: number;
  trend: { direction: "up" | "down" | "flat"; label: string };
  topStudent?: StudentWithPrediction;
};

export function BentoHero({
  greeting,
  globalRisk,
  alerts,
  healthScore,
  trend,
  topStudent,
}: BentoHeroProps) {
  const TrendIcon =
    trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : Minus;

  return (
    <div className="relative flex h-full flex-col justify-between p-6 md:p-8 lg:p-9">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_45%)]"
        aria-hidden
      />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Centro de comando · I.E.P. Huancayo
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
          {greeting}
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
          Riesgo agregado del cohorte, alertas activas y señales del ensemble en una sola vista.
        </p>
      </div>

      <div className="relative mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Índice de riesgo global
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-6xl font-bold tabular-nums tracking-tight text-[var(--text-primary)] md:text-7xl">
              <AnimatedNumber value={globalRisk} />
            </span>
            <span className="text-lg text-[var(--text-muted)]">/ 100</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                trend.direction === "up"
                  ? "bg-rose-500/10 text-rose-300 ring-rose-500/20"
                  : trend.direction === "down"
                    ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                    : "bg-white/5 text-[var(--text-secondary)] ring-white/10"
              }`}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              {trend.label}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{healthScore}% cohorte saludable</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">Alertas tempranas</p>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--text-primary)]">{alerts}</p>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Requieren seguimiento</p>
          </div>
          {topStudent ? (
            <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.06] p-4">
              <p className="text-xs text-rose-300/80">Prioridad máxima</p>
              <p className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
                {topStudent.nombres} {topStudent.apellidos}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-300">
                {Math.round(topStudent.prediction.score)}
                <span className="ml-1 text-xs font-normal text-rose-300/70">pts</span>
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Sin casos críticos ahora</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
