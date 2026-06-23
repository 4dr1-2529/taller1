import type { AppSection } from "@/data/navigation";

export const SECTION_LABELS: Record<AppSection, string> = {
  Dashboard: "Dashboard",
  Estudiantes: "Estudiantes",
  Profesores: "Profesores",
  Asignaciones: "Asignaciones docentes",
  Cursos: "Cursos",
  Matrículas: "Matrículas",
  Notas: "Notas",
  Asistencia: "Asistencia",
  "Actividad LMS": "Actividad LMS",
  Predicción: "Predicción de riesgo",
  "Historial predicciones": "Historial de predicciones",
  Alertas: "Alertas tempranas",
  "Mensajería Académica": "Mensajería Académica",
  Reportes: "Reportes",
};

export function getSectionLabel(section: AppSection, role?: string): string {
  if (role === "estudiante") {
    const studentLabels: Partial<Record<AppSection, string>> = {
      Notas: "Mis notas",
      Asistencia: "Mi asistencia",
      "Actividad LMS": "Mi actividad LMS",
      Predicción: "Mi riesgo",
    };
    if (studentLabels[section]) return studentLabels[section]!;
  }
  return SECTION_LABELS[section] ?? section;
}

export const ENTIDAD_LABELS: Record<string, string> = {
  Student: "Estudiante",
  Teacher: "Profesor",
  Course: "Curso",
  Alert: "Alerta",
  Prediction: "Predicción",
};

export function getEntidadLabel(entidad: string): string {
  return ENTIDAD_LABELS[entidad] ?? entidad;
}
