import type { FactorKey } from "@/types/academic";

export type Recommendation = {
  titulo: string;
  detalle: string;
};

const BY_FACTOR: Record<FactorKey, Recommendation[]> = {
  bajo_promedio: [
    {
      titulo: "Reforzamiento académico",
      detalle:
        "Asignar tutoría en el curso con menor nota y plan de recuperación quincenal con metas medibles.",
    },
    {
      titulo: "Seguimiento docente",
      detalle:
        "Coordinar con el profesor del área crítica para reporte de avances cada dos semanas.",
    },
  ],
  baja_asistencia: [
    {
      titulo: "Contacto con familia",
      detalle:
        "Llamada o visita domiciliaria para identificar barreras de asistencia (salud, transporte, trabajo).",
    },
    {
      titulo: "Compromiso de asistencia",
      detalle: "Acordar meta de asistencia ≥ 85 % en el siguiente bimestre con registro semanal.",
    },
  ],
  baja_actividad_lms: [
    {
      titulo: "Activación digital",
      detalle:
        "Capacitación breve en plataforma LMS y asignación de actividades gamificadas de bajo esfuerzo.",
    },
    {
      titulo: "Monitoreo semanal",
      detalle: "Revisar minutos en plataforma y entregas; alertar si la actividad cae dos semanas seguidas.",
    },
  ],
  tareas_incompletas: [
    {
      titulo: "Plan de entregas",
      detalle:
        "Calendarizar tareas pendientes con fechas intermedias y acompañamiento del tutor de aula.",
    },
    {
      titulo: "Apoyo entre pares",
      detalle: "Emparejar con estudiante mentor del mismo nivel para revisión de tareas clave.",
    },
  ],
};

const DEFAULT: Recommendation[] = [
  {
    titulo: "Seguimiento integral",
    detalle: "Revisar avance en tutoría y actualizar ficha de alerta temprana en 15 días.",
  },
];

export function recommendationsForFactor(key: FactorKey): Recommendation[] {
  return BY_FACTOR[key] ?? DEFAULT;
}
