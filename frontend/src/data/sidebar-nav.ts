import type { AppSection } from "@/data/navigation";

export type SidebarGroupId = "overview" | "academic" | "ai" | "comms";

export type SidebarGroup = {
  id: SidebarGroupId;
  label: string;
  items: AppSection[];
};

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    id: "overview",
    label: "Panel",
    items: ["Dashboard"],
  },
  {
    id: "academic",
    label: "Gestión académica",
    items: ["Estudiantes", "Profesores", "Asignaciones", "Cursos", "Matrículas", "Notas", "Asistencia", "Actividad LMS"],
  },
  {
    id: "ai",
    label: "Predicción de deserción",
    items: ["Predicción", "Historial predicciones", "Alertas"],
  },
  {
    id: "comms",
    label: "Comunicación",
    items: ["Mensajería Académica", "Reportes"],
  },
];

export function groupsForSections(visible: readonly AppSection[]): SidebarGroup[] {
  const set = new Set(visible);
  return SIDEBAR_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => set.has(item)),
  })).filter((g) => g.items.length > 0);
}

export const SECTION_BREADCRUMB: Record<AppSection, string[]> = {
  Dashboard: ["Inicio", "Panel principal"],
  Estudiantes: ["Académico", "Estudiantes"],
  Profesores: ["Académico", "Profesores"],
  Asignaciones: ["Académico", "Asignaciones docentes"],
  Cursos: ["Académico", "Cursos"],
  Matrículas: ["Académico", "Matrículas"],
  Notas: ["Académico", "Notas"],
  Asistencia: ["Académico", "Asistencia"],
  "Actividad LMS": ["Académico", "Plataforma virtual"],
  Predicción: ["IA", "Riesgo de deserción"],
  "Historial predicciones": ["IA", "Historial"],
  Alertas: ["IA", "Alertas tempranas"],
  "Mensajería Académica": ["Comunicación", "Mensajes"],
  Reportes: ["Analítica", "Reportes"],
};
