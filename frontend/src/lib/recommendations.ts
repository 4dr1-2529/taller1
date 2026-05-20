import type { FactorKey } from "../types/academic";

export type Recommendation = {
  factorKey: FactorKey | string;
  titulo: string;
  detalle: string;
};

const BY_FACTOR: Record<FactorKey, Recommendation[]> = {
  bajo_promedio: [
    { factorKey: "bajo_promedio", titulo: "Reforzamiento académico", detalle: "Asignar tutoría en el curso con menor nota y plan de recuperación quincenal con metas medibles." },
    { factorKey: "bajo_promedio", titulo: "Seguimiento docente", detalle: "Coordinar con el profesor del área crítica para reporte de avances cada dos semanas." },
  ],
  baja_asistencia: [
    { factorKey: "baja_asistencia", titulo: "Contacto con familia", detalle: "Llamada o visita domiciliaria para identificar barreras de asistencia (salud, transporte, trabajo)." },
    { factorKey: "baja_asistencia", titulo: "Compromiso de asistencia", detalle: "Acordar meta de asistencia ≥ 85 % en el siguiente bimestre con registro semanal." },
  ],
  baja_actividad_lms: [
    { factorKey: "baja_actividad_lms", titulo: "Activación digital", detalle: "Capacitación breve en plataforma LMS y asignación de actividades gamificadas de bajo esfuerzo." },
    { factorKey: "baja_actividad_lms", titulo: "Monitoreo semanal", detalle: "Revisar minutos en plataforma y entregas; alertar si la actividad cae dos semanas seguidas." },
  ],
  tareas_incompletas: [
    { factorKey: "tareas_incompletas", titulo: "Plan de entregas", detalle: "Calendarizar tareas pendientes con fechas intermedias y acompañamiento del tutor de aula." },
    { factorKey: "tareas_incompletas", titulo: "Apoyo entre pares", detalle: "Emparejar con estudiante mentor del mismo nivel para revisión de tareas clave." },
  ],
};

const DEFAULT: Recommendation[] = [
  { factorKey: "general", titulo: "Seguimiento integral", detalle: "Revisar avance en tutoría y actualizar ficha de alerta temprana en 15 días." },
];

export function recommendationsForFactor(key: FactorKey | string): Recommendation[] {
  return BY_FACTOR[key as FactorKey] ?? DEFAULT;
}

