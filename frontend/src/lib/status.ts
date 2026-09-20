export type ApiStudentStatus = "activo" | "retirado";
export type UiStudentStatus = "activo" | "retirado";

export function toApiStatus(estado: UiStudentStatus): ApiStudentStatus {
  return estado;
}

export function toUiStatus(estado: string): UiStudentStatus {
  if (estado === "retirado") return "retirado";
  return "activo";
}

export function toRiskEngineStatus(estado: string): ApiStudentStatus {
  return toApiStatus(toUiStatus(estado));
}
