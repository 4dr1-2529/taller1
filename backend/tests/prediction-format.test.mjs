/**
 * Prueba unitaria del formato de respuesta tesis.
 * node backend/tests/prediction-format.test.mjs
 */
import assert from "node:assert/strict";

function toThesisPrediction(p) {
  const NIVEL = { bajo: "Bajo", medio: "Medio", alto: "Alto" };
  return {
    probabilidad_abandono: Math.round(p.probabilityAbandono * 1000) / 1000,
    score_predictivo: Math.round(p.score * 10) / 10,
    nivel_riesgo: NIVEL[p.level] ?? p.level,
    factores_riesgo: p.factors,
    recomendacion: p.recommendation,
    modelo_usado: p.modelName,
    fecha_prediccion: p.predictedAt,
  };
}

const sample = {
  score: 85.2,
  level: "alto",
  probabilityAbandono: 0.852,
  factors: [{ key: "asistencia", label: "Baja asistencia", contribution: 12 }],
  modelName: "stacking",
  recommendation: "Intervención prioritaria",
  predictedAt: "2026-06-02T12:00:00.000Z",
};

const tesis = toThesisPrediction(sample);

assert.strictEqual(tesis.nivel_riesgo, "Alto", "nivel_riesgo en español");
assert.strictEqual(tesis.score_predictivo, 85.2, "score_predictivo numérico");
assert.strictEqual(tesis.probabilidad_abandono, 0.852, "probabilidad_abandono");
assert.ok(
  Array.isArray(tesis.factores_riesgo) && tesis.factores_riesgo.length === 1,
  "factores_riesgo array",
);

console.log("prediction-format.test.mjs: todas las aserciones pasaron");
