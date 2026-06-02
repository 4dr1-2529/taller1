/** Secciones del sistema — enfoque tesis ML deserción (3 roles). */
export const APP_SECTIONS = [
  "Dashboard",
  "Estudiantes",
  "Profesores",
  "Cursos",
  "Matrículas",
  "Notas",
  "Asistencia",
  "Actividad LMS",
  "Predicción",
  "Historial predicciones",
  "Alertas",
  "Mensajería Académica",
  "Reportes",
] as const;

export type AppSection = (typeof APP_SECTIONS)[number];
