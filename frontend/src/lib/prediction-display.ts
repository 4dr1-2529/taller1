export function formatContributionPoints(contribution: number): string {
  return `${Math.round(contribution)} pts`;
}

/** Etiqueta legible del origen de datos usado por el modelo. */
export function dataModeLabel(dataMode?: string | null): string {
  if (!dataMode) return "—";
  if (dataMode === "synthetic_scientific") return "Sintético científico (V6)";
  if (dataMode === "real") return "Institucional real";
  if (dataMode === "synthetic") return "Sintético";
  return dataMode;
}
