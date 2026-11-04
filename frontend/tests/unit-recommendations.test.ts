import test from "node:test";
import assert from "node:assert/strict";
import { recommendationsForFactor } from "../src/lib/recommendations.js";

test("cada factor de riesgo entrega recomendaciones específicas y no vacías", () => {
  for (const factor of ["bajo_promedio", "baja_asistencia", "baja_actividad_lms", "tareas_incompletas"]) {
    const recommendations = recommendationsForFactor(factor);
    assert.strictEqual(recommendations.length, 2);
    assert.ok(recommendations.every((item) => item.factorKey === factor && item.titulo.length > 0 && item.detalle.length > 0));
  }
});

test("un factor nuevo recibe la recomendación integral de respaldo", () => {
  const [recommendation] = recommendationsForFactor("factor_futuro");
  assert.deepStrictEqual(recommendation, {
    factorKey: "general",
    titulo: "Seguimiento integral",
    detalle: "Revisar avance en tutoría y actualizar ficha de alerta temprana en 15 días.",
  });
});
