/** Límites polidocencia (3°–6°): 2 cursos por docente; salones configurables 6–8. */
function readMaxSections(): number {
  const raw = process.env.POLIDOCENCIA_MAX_SALONES;
  const parsed = raw != null && raw !== "" ? Number(raw) : 8;
  if (!Number.isFinite(parsed)) return 8;
  return Math.min(8, Math.max(6, Math.round(parsed)));
}

export const MAX_POLIDOCENCIA_COURSES = 2;
export const MAX_POLIDOCENCIA_SECTIONS = readMaxSections();
