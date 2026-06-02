export const APP_SECTIONS = [
  "Dashboard",
  "Estructura académica",
  "Alertas",
  "Seguimiento psicológico",
  "Estudiantes",
  "Profesores",
  "Cursos",
  "Matrículas",
  "Notas",
  "Asistencia",
  "Actividad LMS",
  "Predicción",
  "Historial predicciones",
  "Chat",
  "Reportes",
  "Monitoreo docentes",
] as const;

export type AppSection = (typeof APP_SECTIONS)[number];
