import type { AcademicFilterState } from "@/lib/student-filters";

export type PredictionHistoryQuery = {
  gradoId?: string;
  seccionId?: string;
  cursoId?: string;
  riskLevel?: string;
  search?: string;
};

/**
 * Snapshot explícito de los filtros al pulsar "Buscar".
 *
 * `useProfessorFilters.applied` sólo se sincroniza mediante `setApplied`, que es
 * asíncrono: leerlo dentro de `load()` hacía que la primera consulta viajara con
 * los filtros de la búsqueda anterior. La búsqueda, por tanto, se resuelve con
 * el borrador visible en el momento del clic.
 *
 * @param draft estado visible de los controles al pulsar "Buscar".
 */
export function resolveHistorySearchFilters(draft: AcademicFilterState): AcademicFilterState {
  return { ...draft };
}

/**
 * Convierte los filtros del historial en los parámetros exactos de la consulta.
 * Cadena vacía o en blanco => parámetro ausente (la API aplica su comportamiento por defecto).
 */
export function buildHistoryQuery(filters: AcademicFilterState): PredictionHistoryQuery {
  return {
    gradoId: filters.gradoId || undefined,
    seccionId: filters.seccionId || undefined,
    cursoId: filters.courseId || undefined,
    riskLevel: filters.riskLevel || undefined,
    search: filters.search.trim() || undefined,
  };
}
