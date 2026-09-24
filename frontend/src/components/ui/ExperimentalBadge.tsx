"use client";

import { FlaskConical } from "lucide-react";

type ExperimentalBadgeProps = {
  /** "synthetic_scientific" cuando el modelo corre sobre el Data Seed V6. */
  dataMode?: string | null;
  datasetVersion?: string | null;
  /** Texto corto para tablas y filas compactas. */
  compact?: boolean;
  className?: string;
};

/**
 * Aviso discreto y consistente: el modelo experimental usa datos sintéticos V6,
 * no evidencia institucional real. No rediseña la vista, solo etiqueta.
 */
export function ExperimentalBadge({
  dataMode,
  datasetVersion,
  compact = false,
  className = "",
}: ExperimentalBadgeProps) {
  if (dataMode && dataMode !== "synthetic_scientific") return null;
  // Sin dataMode explícito solo etiquetamos si la trazabilidad indica V6;
  // los registros legados sin metadata no deben rotularse como sintéticos.
  if (!dataMode && !(datasetVersion ?? "").includes("V6")) return null;

  const version = datasetVersion ?? "V6";
  const short = version.includes("V6") ? "Sintético V6" : version;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 ${className}`}
      title="Modelo experimental entrenado con datos científicos sintéticos V6: no constituye evidencia institucional."
    >
      <FlaskConical className="h-3 w-3" aria-hidden />
      {compact ? short : `Modelo experimental · Datos sintéticos ${short}`}
    </span>
  );
}

export function ExperimentalNote({
  dataMode,
  datasetVersion,
  modelVersion,
}: {
  dataMode?: string | null;
  datasetVersion?: string | null;
  modelVersion?: string | null;
}) {
  if (dataMode && dataMode !== "synthetic_scientific") return null;
  if (!dataMode && !(datasetVersion ?? "").includes("V6")) return null;
  return (
    <p className="text-xs leading-snug text-amber-700/90 dark:text-amber-400/90">
      Riesgo predictivo experimental calculado sobre el Data Seed V6 (sintético).
      {datasetVersion ? ` Dataset ${datasetVersion}.` : ""}
      {modelVersion ? ` Modelo ${modelVersion}.` : ""}
      {" "}No sustituye el juicio académico ni la evidencia institucional real.
    </p>
  );
}
