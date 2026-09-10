"use client";

import { ArrowDownRight, ArrowUpRight, Minus, AlertTriangle, Sparkles } from "lucide-react";
import { RiskGauge } from "@/components/ui/RiskGauge";
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
    <div className="command-hero">
      <header><p className="intelligence-eyebrow">Panorama de riesgo</p><h3>{greeting}</h3>
        <p>Riesgo del cohorte y señales para orientar el acompañamiento.</p></header>
      <div className="command-hero__focus">
        <RiskGauge score={globalRisk} level="" neutral valueLabel={<AnimatedNumber value={globalRisk} />} />
        <div className="command-hero__context">
          <p className="text-sm font-semibold">Índice de riesgo global</p>
          <span className={`trend-pill ${trend.direction === "up" ? "text-[var(--risk-high)]" : trend.direction === "down" ? "text-[var(--risk-low)]" : "text-[var(--text-secondary)]"}`}>
            <TrendIcon size={15} aria-hidden />{trend.label}
          </span>
          <p className="text-sm text-[var(--text-muted)]">{healthScore}% cohorte saludable</p>
          <div className="command-alert-count"><AlertTriangle size={16} aria-hidden /><strong>{alerts}</strong><span>Alertas tempranas<br /><small>Requieren seguimiento</small></span></div>
        </div>
      </div>
      {topStudent ? <div className="command-priority">
        <span>Prioridad máxima</span><strong>{topStudent.nombres} {topStudent.apellidos}</strong>
        <b>{Math.round(topStudent.prediction.score)} <small>pts</small></b>
      </div> : <div className="command-priority"><Sparkles size={16} aria-hidden /><span>Sin casos críticos ahora</span></div>}
    </div>
  );
}
