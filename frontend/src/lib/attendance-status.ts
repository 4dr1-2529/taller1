export type AttendanceEstado = "presente" | "tardanza" | "falta" | "falta_justificada";

export const ATTENDANCE_ESTADOS: {
  value: AttendanceEstado;
  label: string;
  hint: string;
}[] = [
  { value: "presente", label: "Asistió", hint: "El estudiante asistió a clase" },
  { value: "tardanza", label: "Tardanza", hint: "Llegó tarde pero estuvo en clase" },
  { value: "falta", label: "Falta", hint: "No asistió (inasistencia)" },
  { value: "falta_justificada", label: "Falta justificada", hint: "No asistió con justificación válida" },
];

export function estadoToFlags(estado: AttendanceEstado) {
  switch (estado) {
    case "presente":
      return { presente: true, tardanza: false, justificado: false };
    case "tardanza":
      return { presente: true, tardanza: true, justificado: false };
    case "falta":
      return { presente: false, tardanza: false, justificado: false };
    case "falta_justificada":
      return { presente: false, tardanza: false, justificado: true };
  }
}

export function flagsToEstado(row: {
  presente: boolean;
  tardanza: boolean;
  justificado: boolean;
}): AttendanceEstado {
  if (row.presente && row.tardanza) return "tardanza";
  if (row.presente) return "presente";
  if (row.justificado) return "falta_justificada";
  return "falta";
}

export function estadoLabel(estado: AttendanceEstado): string {
  return ATTENDANCE_ESTADOS.find((e) => e.value === estado)?.label ?? estado;
}

export function estadoBadgeClass(estado: AttendanceEstado): string {
  switch (estado) {
    case "presente":
      return "status-chip status-chip--success";
    case "tardanza":
      return "status-chip status-chip--warning";
    case "falta":
      return "status-chip status-chip--danger";
    case "falta_justificada":
      return "status-chip status-chip--info";
  }
}
