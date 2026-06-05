export type GradeStatusLabel = "Aprobado" | "En riesgo" | "Desaprobado";

export function notaEstadoLabel(nota: number): GradeStatusLabel {
  if (nota < 11) return "Desaprobado";
  if (nota < 14) return "En riesgo";
  return "Aprobado";
}
