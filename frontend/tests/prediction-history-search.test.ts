import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildHistoryQuery,
  resolveHistorySearchFilters,
} from "../src/lib/prediction-history-search";
import { defaultAcademicFilters } from "../src/lib/student-filters";

/**
 * Regresión: la primera búsqueda del historial del profesor viajaba con los
 * filtros anteriores porque `load()` leía `pf.applied`, que sólo se sincroniza
 * en el siguiente render (setApplied es asíncrono).
 */
test("la consulta usa el borrador visible aunque 'applied' siga desactualizado", () => {
  // Estado anterior ya aplicado (sin grado/sección).
  const appliedStale = defaultAcademicFilters();

  // Lo que el usuario ve y pulsa: grado 3, sección A, curso, riesgo y texto.
  const draft = {
    ...defaultAcademicFilters(),
    gradoId: "3",
    seccionId: "sec-3a",
    courseId: "cur-1",
    riskLevel: "alto",
    search: "José",
  };

  // `search()` toma el snapshot ANTES de que React persista `applied`.
  const snapshot = resolveHistorySearchFilters(draft);
  const query = buildHistoryQuery(snapshot);

  assert.equal(query.gradoId, "3");
  assert.equal(query.seccionId, "sec-3a");
  assert.equal(query.cursoId, "cur-1");
  assert.equal(query.riskLevel, "alto");
  assert.equal(query.search, "José");

  // El estado anterior no debe filtrar la primera búsqueda.
  assert.notDeepEqual(buildHistoryQuery(appliedStale), query);
});

test("buildHistoryQuery mapea exactamente grado, sección, curso, riesgo y texto", () => {
  const filters = {
    ...defaultAcademicFilters(),
    gradoId: "4",
    seccionId: "sec-4a",
    courseId: "cur-2",
    riskLevel: "medio",
    search: "Mamani",
  };
  assert.deepEqual(buildHistoryQuery(filters), {
    gradoId: "4",
    seccionId: "sec-4a",
    cursoId: "cur-2",
    riskLevel: "medio",
    search: "Mamani",
  });
});

test("los filtros vacíos no emiten parámetro y el texto se recorta", () => {
  const empty = buildHistoryQuery(defaultAcademicFilters());
  assert.equal(empty.gradoId, undefined);
  assert.equal(empty.seccionId, undefined);
  assert.equal(empty.cursoId, undefined);
  assert.equal(empty.riskLevel, undefined);
  assert.equal(empty.search, undefined);

  const blank = buildHistoryQuery({ ...defaultAcademicFilters(), search: "   Rosa   " });
  assert.equal(blank.search, "Rosa");
});

test("el snapshot copia el estado sin mutar el borrador original", () => {
  const draft = { ...defaultAcademicFilters(), gradoId: "5" };
  const snapshot = resolveHistorySearchFilters(draft);
  assert.notEqual(snapshot, draft);
  assert.deepEqual(snapshot, draft);
  snapshot.gradoId = "6";
  assert.equal(draft.gradoId, "5");
});
