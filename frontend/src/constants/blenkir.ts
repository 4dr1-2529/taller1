/** Identidad y catálogo institucional — Colegio Blenkir */

export const BLENKIR_COLORS = {
  orange: "#F47C20",
  white: "#FFFFFF",
  navy: "#1F3A5F",
  bg: "#F5F7FA",
  text: "#4B5563",
  textDark: "#1F2937",
} as const;

export const BLENKIR_GRADES = ["1°", "2°", "3°", "4°", "5°", "6°"] as const;

export const BLENKIR_SECTIONS = ["A", "B", "C", "D"] as const;

export const BLENKIR_COURSES = [
  "Aritmética",
  "Álgebra",
  "Razonamiento Matemático",
  "Geometría",
  "Producción de Textos",
  "Gramática",
  "Razonamiento Verbal",
  "Cuerpo Humano",
  "Mundo Físico",
  "Ciudadanía",
  "Geografía",
  "Historia",
  "Religión",
  "Inglés",
  "Taller",
  "Educación Física",
] as const;

export const BIMESTRES = [1, 2, 3, 4] as const;

export const PROFESOR_HINTS = {
  selectGradoSeccion: "Seleccione grado y sección para buscar estudiantes.",
  selectGradoSeccionSalon: "Seleccione grado y sección para filtrar por salón.",
  selectCourse: "Seleccione el curso que dicta.",
  selectStudentPredict: "Seleccione un estudiante para generar predicción.",
  noCoursesInSection: "Este profesor no tiene cursos asignados en esta sección.",
  noStudents: "Este profesor no tiene estudiantes asignados en este grado y sección.",
  noResults: "No se encontraron estudiantes con esos filtros.",
  noGrades: "Los estudiantes están cargados, pero aún no tienen notas.",
  noLms: "Los estudiantes están cargados, pero aún no tienen actividad LMS registrada.",
  noAlerts: "No hay alertas para los filtros seleccionados.",
  allAlerts: "Mostrando todas las alertas asignadas al profesor.",
  noPredictionData: "Faltan datos académicos o LMS para generar la predicción.",
  pressSearch: "Configure los filtros y presione Buscar.",
} as const;

export const FILTER_HINTS = {
  selectGrado: "Seleccione primero un grado.",
  selectSeccion: "Seleccione una sección o salón.",
  selectStudent: "Seleccione un estudiante.",
  noStudents: "No hay estudiantes asignados a este profesor en este grado y sección.",
  noStudentsProfesor: "No hay estudiantes asignados a este profesor en este grado y sección.",
  noGradesLoaded:
    "Los estudiantes están cargados, pero aún no tienen notas registradas.",
  noLmsData:
    "Los estudiantes están cargados, pero aún no tienen actividad LMS registrada.",
  noPredictionData:
    "Faltan datos académicos o LMS para generar la predicción.",
  noAlerts: "No hay alertas para este filtro.",
  noGrades: "No hay notas registradas para este filtro.",
} as const;
