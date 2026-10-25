import test from "node:test";
import assert from "node:assert/strict";
import { recommendationsForFactor } from "../../src/services/recommendations.js";

test("recommendationsForFactor devuelve recomendaciones para bajo_promedio", () => {
  const recs = recommendationsForFactor("bajo_promedio");
  assert.ok(Array.isArray(recs));
  assert.ok(recs.length > 0);
  assert.ok(recs.every((r) => r.factorKey === "bajo_promedio"));
});

test("recommendationsForFactor devuelve recomendaciones para baja_asistencia", () => {
  const recs = recommendationsForFactor("baja_asistencia");
  assert.ok(Array.isArray(recs));
  assert.ok(recs.length > 0);
  assert.ok(recs.every((r) => r.factorKey === "baja_asistencia"));
});

test("recommendationsForFactor devuelve DEFAULT para clave desconocida", () => {
  const recs = recommendationsForFactor("factor_inexistente");
  assert.ok(Array.isArray(recs));
  assert.ok(recs.length > 0);
  assert.ok(recs.some((r) => r.factorKey === "general"));
});

test("recommendationsForFactor incluye cursos_desaprobados", () => {
  const recs = recommendationsForFactor("cursos_desaprobados");
  assert.ok(recs.some((r) => r.titulo.includes("Recuperación")));
});

test("recommendationsForFactor incluye bajo_foro", () => {
  const recs = recommendationsForFactor("bajo_foro");
  assert.ok(recs.some((r) => r.titulo.includes("foros")));
});
