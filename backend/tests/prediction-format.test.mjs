/**
 * Prueba unitaria del formato de respuesta tesis.
 * node backend/tests/prediction-format.test.mjs
 */
import assert from "node:assert/strict";

import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { toThesisPrediction } = await tsImport("../src/utils/prediction-format.ts", import.meta.url);

const sample = {
  score: 85.2,
  level: "alto",
  probabilityAbandono: 0.852,
  factors: [{ key: "asistencia", label: "Baja asistencia", contribution: 12 }],
  modelName: "stacking",
  recommendation: "Intervención prioritaria",
  predictedAt: "2026-06-02T12:00:00.000Z",
};

test("el formato de tesis usa el contrato productivo y conserva trazabilidad", () => {
  const tesis = toThesisPrediction(sample);

  assert.strictEqual(tesis.nivel_riesgo, "Alto", "nivel_riesgo en español");
  assert.strictEqual(tesis.score_predictivo, 85.2, "score_predictivo numérico");
  assert.strictEqual(tesis.probabilidad_abandono, 0.852, "probabilidad_abandono");
  assert.ok(
    Array.isArray(tesis.factores_riesgo) && tesis.factores_riesgo.length === 1,
    "factores_riesgo array",
  );

  assert.equal(tesis.modelo_usado, sample.modelName);
  assert.equal(tesis.recomendacion, sample.recommendation);
  assert.equal(tesis.fecha_prediccion, sample.predictedAt);
  assert.equal(tesis.fecha, sample.predictedAt);
});
