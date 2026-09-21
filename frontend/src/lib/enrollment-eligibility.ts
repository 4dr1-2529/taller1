import type { Student } from "@/types/academic";

/**
 * Estudiantes elegibles para una matrícula 2026 nueva: solo quienes NO tienen
 * NINGUNA matrícula del año (activa, retirada o trasladada). El backend sigue
 * siendo la autoridad (409); esto es prevención UX.
 */
export function getEligibleStudents(
  candidates: Student[],
  matriculadosIds: Set<string> | string[] | null | undefined,
): Student[] {
  const blocked = matriculadosIds instanceof Set
    ? matriculadosIds
    : new Set(matriculadosIds ?? []);
  return candidates.filter((s) => !blocked.has(s.id));
}
