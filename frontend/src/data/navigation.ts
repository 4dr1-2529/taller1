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
  "Datos académicos",
  "Actividad LMS",
  "Predicción",
  "Modelos IA",
  "Chat",
  "Reportes",
] as const;

export type AppSection = (typeof APP_SECTIONS)[number];
