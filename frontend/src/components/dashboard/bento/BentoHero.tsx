"use client";

import { ArrowDownRight, ArrowUpRight, Minus, AlertTriangle, Sparkles } from "lucide-react";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { ExperimentalBadge } from "@/components/ui/ExperimentalBadge";
import type { StudentWithPrediction } from "@/lib/aggregates";

type BentoHeroProps = {
  greeting: string;
  globalRisk: number | null;
  alerts: number;
  healthScore: number | null;
  trend: { direction: "up" | "down" | "flat"; label: string };
  topStudent?: StudentWithPrediction;
  /** Modelo experimental V6 (datos sintéticos) activo */
  experimental?: boolean;
  datasetVersion?: string | null;
  /** Estudiantes evaluados por el modelo dentro del alcance del rol */
  evaluated?: number;
  evaluatedTotal?: number;
  avgProbability?: number | null;
};

export function BentoHero({
  greeting,
  globalRisk,
  alerts,
  healthScore,
  trend,
  topStudent,
  experimental = false,
  datasetVersion = null,
  evaluated,
  evaluatedTotal,
  avgProbability = null,
}: BentoHeroProps) {
  const TrendIcon =
    trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : Minus;
  const hasPredictions = globalRisk != null;
  const evaluatedLabel =
    evaluated != null && evaluatedTotal != null ? `${evaluated} / ${evaluatedTotal}` : null;

  return (
    <div className="command-hero">
      <header>
        <p className="intelligence-eyebrow">
          {experimental && hasPredictions ? "Riesgo predictivo experimental" : "Panorama de riesgo"}
        </p>
        <h3>{greeting}</h3>
        <p>
          {experimental && hasPredictions
            ? "Riesgo del cohorte calculado por el modelo experimental (datos sintéticos V6)."
            : "Riesgo del cohorte y señales para orientar el acompañamiento."}
        </p>
        {experimental ? (
          <ExperimentalBadge dataMode="synthetic_scientific" datasetVersion={datasetVersion} />
        ) : null}
      </header>
      <div className="command-hero__focus">
        <RiskGauge
          score={globalRisk ?? 0}
          level=""
          neutral
          valueLabel={globalRisk == null ? "Sin evaluación predictiva" : <AnimatedNumber value={globalRisk} />}
        />
        <div className="command-hero__context">
          <p className="text-sm font-semibold">Índice de riesgo global</p>
          <span className={`trend-pill ${trend.direction === "up" ? "text-[var(--risk-high)]" : trend.direction === "down" ? "text-[var(--risk-low)]" : "text-[var(--text-secondary)]"}`}>
            <TrendIcon size={15} aria-hidden />{trend.label}
          </span>
          <p className="text-sm text-[var(--text-muted)]">
            {healthScore == null ? "Sin datos de cohorte" : `${healthScore}% cohorte saludable`}
          </p>
          {evaluatedLabel ? (
            <p className="text-sm text-[var(--text-muted)]">
              Evaluados: <strong className="text-[var(--text-primary)]">{evaluatedLabel}</strong>
            </p>
          ) : null}
          {avgProbability != null ? (
            <p className="text-sm text-[var(--text-muted)]">
              Probabilidad de deserción media:{" "}
              <strong className="text-[var(--text-primary)]">{(avgProbability * 100).toFixed(1)}%</strong>
            </p>
          ) : null}
          <div className="command-alert-count">
            <AlertTriangle size={16} aria-hidden />
            <strong>{alerts}</strong>
            <span>
              Alertas tempranas
              <br />
              <small>Requieren seguimiento</small>
            </span>
          </div>
        </div>
      </div>
      {topStudent ? (
        <div className="command-priority">
          <span>Prioridad máxima</span>
          <strong>
            {topStudent.nombres} {topStudent.apellidos}
          </strong>
          <b>
            {Math.round(topStudent.prediction.score)} <small>pts</small>
          </b>
        </div>
      ) : (
        <div className="command-priority">
          <Sparkles size={16} aria-hidden />
          <span>Sin casos críticos ahora</span>
        </div>
      )}
    </div>
  );
}
