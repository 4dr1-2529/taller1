export type ApiStudentStatus = "activo" | "en_riesgo" | "retirado";
export type UiStudentStatus = "activo" | "en riesgo" | "retirado";

export function toApiStatus(estado: UiStudentStatus): ApiStudentStatus {
  if (estado === "en riesgo") return "en_riesgo";
  return estado;
}

export function toUiStatus(estado: string): UiStudentStatus {
  if (estado === "en_riesgo") return "en riesgo";
  if (estado === "retirado") return "retirado";
  return "activo";
}

export function toRiskEngineStatus(estado: string): ApiStudentStatus {
  return toApiStatus(toUiStatus(estado));
}
