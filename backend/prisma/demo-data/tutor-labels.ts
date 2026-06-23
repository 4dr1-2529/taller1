/** Un tutor exclusivo por salón de 1° y 2° (8 salones = 8 docentes). */
export const TUTOR_SALON_LABELS = [
  { grado: 1, seccion: "A", especialidad: "Tutor de aula — 1° A" },
  { grado: 1, seccion: "B", especialidad: "Tutor de aula — 1° B" },
  { grado: 1, seccion: "C", especialidad: "Tutor de aula — 1° C" },
  { grado: 1, seccion: "D", especialidad: "Tutor de aula — 1° D" },
  { grado: 2, seccion: "A", especialidad: "Tutor de aula — 2° A" },
  { grado: 2, seccion: "B", especialidad: "Tutor de aula — 2° B" },
  { grado: 2, seccion: "C", especialidad: "Tutor de aula — 2° C" },
  { grado: 2, seccion: "D", especialidad: "Tutor de aula — 2° D" },
] as const;

export const TUTOR_SALON_COUNT = TUTOR_SALON_LABELS.length;
