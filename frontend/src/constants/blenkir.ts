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

export const FILTER_HINTS = {
  selectGrado: "Seleccione primero un grado.",
  selectSeccion: "Seleccione una sección o salón.",
  selectStudent: "Seleccione un estudiante.",
  noStudents: "No hay estudiantes en este salón.",
  noAlerts: "No hay alertas para este filtro.",
  noGrades: "No hay notas registradas para este filtro.",
} as const;
