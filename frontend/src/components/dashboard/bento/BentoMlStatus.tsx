"use client";

import { FlaskConical, ShieldCheck, Brain } from "lucide-react";
import { dataModeLabel } from "@/lib/prediction-display";

type MlStatus = {
  dataMode?: string | null;
  datasetVersion?: string | null;
  modelVersion?: string | null;
  modelSelected?: string | null;
  contractVersion?: string | null;
  decisionThreshold?: number | null;
  nFeatures?: number | null;
  metricsAvailable?: boolean;
  experimental?: boolean;
  evaluated?: number;
  evaluatedTotal?: number;
  avgProbability?: number | null;
};

/**
 * Bloque ML destacado del dashboard: modelo, versión, origen de datos,
 * contrato y umbral. Solo informativo; no altera la lógica de predicción.
 */
export function BentoMlStatus({ ml, showHint }: { ml?: MlStatus | null; showHint?: boolean }) {
  const experimental = ml?.experimental ?? false;
  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "Modelo", value: ml?.modelSelected || ml?.modelVersion || "—" },
    { label: "Versión", value: ml?.modelVersion ?? "—", mono: true },
    { label: "Origen de datos", value: dataModeLabel(ml?.dataMode) },
    { label: "Versión de dataset", value: ml?.datasetVersion ?? "—", mono: true },
    { label: "Contrato", value: ml?.contractVersion ?? "—" },
    {
      label: "Umbral de decisión",
      value: ml?.decisionThreshold != null ? ml.decisionThreshold.toFixed(2) : "—",
    },
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-muted)] ring-1 ring-[var(--brand-orange)]/25">
            <Brain className="h-4 w-4 text-[var(--brand-orange)]" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Estado del modelo</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Trazabilidad de la estimación predictiva
            </p>
          </div>
        </div>
        <span
          className={
            experimental
              ? "inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400"
              : "inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--risk-low)]/35 bg-[var(--risk-low)]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--risk-low)]"
          }
          title={
            experimental
              ? "Modelo en fase experimental: resultados orientativos, no definitivos."
              : "Modelo marcado como no experimental."
          }
        >
          {experimental ? (
            <FlaskConical className="h-3 w-3" aria-hidden />
          ) : (
            <ShieldCheck className="h-3 w-3" aria-hidden />
          )}
          {experimental ? "Experimental" : "Operativo"}
        </span>
      </header>

      {!ml ? (
        <p className="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] px-3 py-6 text-center text-xs text-[var(--text-muted)]">
          La información del modelo aún no está disponible.
        </p>
      ) : (
        <dl className="mt-4 flex-1 space-y-2">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between gap-3 border-b border-dashed border-[var(--border-subtle)] pb-1.5 last:border-0"
            >
              <dt className="shrink-0 text-xs text-[var(--text-secondary)]">{r.label}</dt>
              <dd
                className={`min-w-0 truncate text-right text-xs font-semibold text-[var(--text-primary)] ${
                  r.mono ? "tabular-nums" : ""
                }`}
                title={r.value}
              >
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {showHint ? (
        <p className="mt-4 text-[11px] leading-snug text-[var(--text-muted)]">
          Métricas y matriz de confusión disponibles en la sección «Predicción de riesgo».
        </p>
      ) : null}
    </div>
  );
}
