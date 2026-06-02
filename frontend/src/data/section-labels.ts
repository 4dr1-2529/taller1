import type { AppSection } from "@/data/navigation";

export const SECTION_LABELS: Record<AppSection, string> = {
  Dashboard: "Panel principal",
  "Estructura académica": "Estructura académica",
  Alertas: "Alertas",
  "Seguimiento psicológico": "Seguimiento psicológico",
  Estudiantes: "Estudiantes",
  Profesores: "Profesores",
  Cursos: "Cursos",
  Matrículas: "Matrículas",
  Notas: "Notas",
  Asistencia: "Asistencia",
  "Actividad LMS": "Actividad en plataforma",
  Predicción: "Predicción IA",
  Chat: "Chat interno",
  Reportes: "Reportes",
  "Monitoreo docentes": "Monitoreo docentes",
};

export function getSectionLabel(section: AppSection): string {
  return SECTION_LABELS[section] ?? section;
}

export const ENTIDAD_LABELS: Record<string, string> = {
  Student: "Estudiante",
  Course: "Curso",
  Enrollment: "Matrícula",
  Grade: "Nota",
  Teacher: "Profesor",
  User: "Usuario",
  Alert: "Alerta",
};

export function getEntidadLabel(entidad: string): string {
  return ENTIDAD_LABELS[entidad] ?? entidad;
}
