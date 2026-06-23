import {
  MAX_POLIDOCENCIA_COURSES,
  MAX_POLIDOCENCIA_SECTIONS,
} from "../../src/config/polidocencia.js";

export { MAX_POLIDOCENCIA_COURSES, MAX_POLIDOCENCIA_SECTIONS };

/** Pares de cursos por docente (3°–6°): exactamente 2 materias por profesor. */
export const TEACHER_COURSE_PAIRS = [
  ["ING", "REL"],
  ["ING", "PDT"],
  ["ING", "GRA"],
  ["PDT", "GRA"],
  ["RZV", "RZM"],
  ["ARI", "ALG"],
  ["GEO", "HIS"],
  ["CIU", "GEG"],
  ["CUH", "MUF"],
  ["EDF", "TAL"],
  ["ING", "EDF"],
  ["REL", "TAL"],
  ["ALG", "ARI"],
  ["HIS", "CIU"],
  ["GEG", "GEO"],
] as const satisfies readonly (readonly [string, string])[];
