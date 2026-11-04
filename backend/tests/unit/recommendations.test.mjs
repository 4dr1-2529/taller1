import test from "node:test";
import assert from "node:assert/strict";
import { recommendationsForFactor } from "../../src/services/recommendations.js";

test("recommendationsForFactor devuelve recomendaciones por factor conocido", () => {
  const recs = recommendationsForFactor("bajo_promedio");
  assert.ok(Array.isArray(recs));
  assert.ok(recs.length > 0);
  assert.ok(recs.every((r) => r.factorKey === "bajo_promedio"));
});

test("recommendationsForFactor devuelve recomendaciones para cada factor", () => {
  for (const key of [
    "bajo_promedio", "baja_asistencia", "baja_actividad_lms",
    "tareas_incompletas", "cursos_desaprobados", "caida_actividad", "bajo_foro",
  ]) {
    const recs = recommendationsForFactor(key);
    assert.ok(recs.length > 0, `debe haber recomendaciones para ${key}`);
    assert.ok(recs.every((r) => r.factorKey === key));
  }
});

test("recommendationsForFactor devuelve default para factor desconocido", () => {
  const recs = recommendationsForFactor("factor_inexistente");
  assert.ok(recs.length > 0);
  assert.strictEqual(recs[0].factorKey, "general");
});

test("recommendationsForFactor incluye campos requeridos", () => {
  const recs = recommendationsForFactor("baja_asistencia");
  for (const r of recs) {
    assert.ok(typeof r.titulo === "string" && r.titulo.length > 0);
    assert.ok(typeof r.detalle === "string" && r.detalle.length > 0);
  }
});
