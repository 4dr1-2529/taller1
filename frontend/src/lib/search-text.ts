/**
 * Normalización para búsquedas LOCALES (sobre listas ya cargadas en memoria).
 * Recorta, pasa a minúsculas y elimina tildes/diacríticos, de modo que
 * "Jose" encuentra "José" y "Matematica" encuentra "Matemática".
 *
 * No se aplica a consultas al backend: esas conservan su contrato actual.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Coincidencia de subcadena ignorando tildes y mayúsculas. Término vacío = sin filtro. */
export function localSearchMatch(haystack: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return normalizeSearchText(haystack).includes(normalizeSearchText(needle));
}
