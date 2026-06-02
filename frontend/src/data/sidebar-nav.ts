import type { AppSection } from "@/data/navigation";

export type SidebarGroupId = "overview" | "academic" | "ai" | "admin";

export type SidebarGroup = {
  id: SidebarGroupId;
  label: string;
  items: AppSection[];
};

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    id: "overview",
    label: "General",
    items: ["Dashboard", "Estructura académica", "Chat"],
  },
  {
    id: "academic",
    label: "Académico",
    items: [
      "Estudiantes",
      "Profesores",
      "Cursos",
      "Matrículas",
      "Notas",
      "Asistencia",
      "Actividad LMS",
      "Seguimiento psicológico",
    ],
  },
  {
    id: "ai",
    label: "IA y analítica",
    items: ["Predicción", "Alertas"],
  },
  {
    id: "admin",
    label: "Administración",
    items: ["Monitoreo docentes", "Reportes"],
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
  "Estructura académica": ["Académico", "Estructura"],
  Alertas: ["IA", "Alertas"],
  "Seguimiento psicológico": ["Académico", "Psicología"],
  Estudiantes: ["Académico", "Estudiantes"],
  Profesores: ["Académico", "Docentes"],
  Cursos: ["Académico", "Cursos"],
  Matrículas: ["Académico", "Matrículas"],
  Notas: ["Académico", "Notas"],
  Asistencia: ["Académico", "Asistencia"],
  "Actividad LMS": ["Académico", "Plataforma"],
  Predicción: ["IA", "Predicción"],
  Chat: ["General", "Mensajes"],
  Reportes: ["Administración", "Reportes"],
  "Monitoreo docentes": ["Administración", "Monitoreo"],
};
