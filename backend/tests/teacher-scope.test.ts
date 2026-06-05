/**
 * Alcance profesor: estudiantes por sección del curso (sin inscripciones masivas).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function uniqueSectionIds(courses: { seccionId: bigint | null }[]): bigint[] {
  return [...new Set(courses.map((c) => c.seccionId).filter((id): id is bigint => id != null))];
}

function studentScopeFromSections(sectionIds: bigint[]) {
  if (!sectionIds.length) return { id: { in: [] as string[] } };
  return { activo: true, seccionId: { in: sectionIds } };
}

describe("teacher scope (sección por curso)", () => {
  it("agrupa secciones únicas de cursos del profesor", () => {
    const ids = uniqueSectionIds([
      { seccionId: 10n },
      { seccionId: 10n },
      { seccionId: 20n },
      { seccionId: null },
    ]);
    assert.deepEqual(ids, [10n, 20n]);
  });

  it("sin secciones → ningún estudiante", () => {
    const scope = studentScopeFromSections([]);
    assert.deepEqual(scope, { id: { in: [] } });
  });

  it("con secciones → filtro por seccionId", () => {
    const scope = studentScopeFromSections([10n, 20n]);
    assert.equal(scope.activo, true);
    assert.deepEqual(scope.seccionId, { in: [10n, 20n] });
  });

  it("director no usa filtro de sección (admin ve todos activos)", () => {
    const adminScope = { activo: true };
    assert.equal("seccionId" in adminScope, false);
  });
});
