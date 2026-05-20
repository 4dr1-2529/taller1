type FactorKey = "bajo_promedio" | "baja_asistencia" | "baja_actividad_lms" | "tareas_incompletas";

export type Recommendation = {
  factorKey: FactorKey | string;
  titulo: string;
  detalle: string;
};

const BY_FACTOR: Record<FactorKey, Recommendation[]> = {
  bajo_promedio: [
    { factorKey: "bajo_promedio", titulo: "Reforzamiento académico", detalle: "Tutoría y plan de recuperación quincenal." },
    { factorKey: "bajo_promedio", titulo: "Seguimiento docente", detalle: "Reporte de avances cada dos semanas." },
  ],
  baja_asistencia: [
    { factorKey: "baja_asistencia", titulo: "Contacto con familia", detalle: "Identificar barreras de asistencia." },
    { factorKey: "baja_asistencia", titulo: "Compromiso de asistencia", detalle: "Meta ≥ 85 % en el siguiente bimestre." },
  ],
  baja_actividad_lms: [
    { factorKey: "baja_actividad_lms", titulo: "Activación digital", detalle: "Capacitación breve en LMS." },
    { factorKey: "baja_actividad_lms", titulo: "Monitoreo semanal", detalle: "Revisar minutos y entregas en plataforma." },
  ],
  tareas_incompletas: [
    { factorKey: "tareas_incompletas", titulo: "Plan de entregas", detalle: "Calendarizar tareas pendientes." },
    { factorKey: "tareas_incompletas", titulo: "Apoyo entre pares", detalle: "Mentor del mismo nivel." },
  ],
};

const DEFAULT: Recommendation[] = [
  { factorKey: "general", titulo: "Seguimiento integral", detalle: "Actualizar ficha de alerta en 15 días." },
];

export function recommendationsForFactor(key: FactorKey | string): Recommendation[] {
  return BY_FACTOR[key as FactorKey] ?? DEFAULT;
}
