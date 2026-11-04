import test from "node:test";
import assert from "node:assert/strict";
import {
  PREDICTION_META_KEYS,
  splitPredictionInput,
  toThesisPrediction,
  buildPredictionApiPayload,
} from "../../src/utils/prediction-format.js";

const prediction = (overrides = {}) => ({
  score: 78.26,
  level: "alto",
  probability: 0.78126,
  probabilityAbandono: 0.78126,
  factors: [{ key: "asistencia", label: "Baja asistencia", contribution: 8 }],
  modelName: "RandomForest",
  recommendation: "Seguimiento prioritario",
  predictedAt: "2026-10-29T12:00:00Z",
  inputData: { promedio_general: 12 },
  modelVersion: "v6",
  datasetVersion: "dataset-1",
  dataMode: "synthetic_scientific",
  contractVersion: "2026-v3",
  decisionThreshold: 0.41,
  ...overrides,
});

test("splitPredictionInput separa metadata de variables y conserva valores", () => {
  const input = {
    promedio_general: 14,
    featureExtra: null,
    modelVersion: "v6",
    datasetVersion: "dataset-1",
    dataMode: "real",
    contractVersion: "2026-v3",
    decisionThreshold: 0.41,
  };
  const result = splitPredictionInput(input);
  assert.deepStrictEqual(result.features, { promedio_general: 14, featureExtra: null });
  assert.deepStrictEqual(result.meta, {
    modelVersion: "v6",
    datasetVersion: "dataset-1",
    dataMode: "real",
    contractVersion: "2026-v3",
    decisionThreshold: 0.41,
  });
  assert.strictEqual(Object.keys(result.meta).length, PREDICTION_META_KEYS.length);
});

test("splitPredictionInput trata null, primitivos y arreglos sin romper el contrato", () => {
  assert.deepStrictEqual(splitPredictionInput(null), { features: {}, meta: {} });
  assert.deepStrictEqual(splitPredictionInput("invalid"), { features: {}, meta: {} });
  assert.deepStrictEqual(splitPredictionInput(["x"]), { features: { 0: "x" }, meta: {} });
});

test("toThesisPrediction traduce nivel, redondea métricas y mantiene compatibilidad", () => {
  const result = toThesisPrediction(prediction());
  assert.strictEqual(result.probabilidad_abandono, 0.781);
  assert.strictEqual(result.score_predictivo, 78.3);
  assert.strictEqual(result.nivel_riesgo, "Alto");
  assert.strictEqual(result.fecha, "2026-10-29T12:00:00Z");
  assert.strictEqual(result.fecha_prediccion, result.fecha);
  assert.strictEqual(result.modelo_usado, "RandomForest");
  assert.deepStrictEqual(result.datos_ingresados, { promedio_general: 12 });
});

test("toThesisPrediction cubre las tres etiquetas de riesgo", () => {
  assert.strictEqual(toThesisPrediction(prediction({ level: "bajo" })).nivel_riesgo, "Bajo");
  assert.strictEqual(toThesisPrediction(prediction({ level: "medio" })).nivel_riesgo, "Medio");
  assert.strictEqual(toThesisPrediction(prediction({ level: "alto" })).nivel_riesgo, "Alto");
});

test("buildPredictionApiPayload conserva aliases y marca datos sintéticos por defecto", () => {
  const result = buildPredictionApiPayload(prediction());
  assert.strictEqual(result.probabilidad_abandono, 0.781);
  assert.strictEqual(result.level, "alto");
  assert.strictEqual(result.probability, 0.78126);
  assert.strictEqual(result.experimental, true);
  assert.deepStrictEqual(result.factors, prediction().factors);
  assert.strictEqual(result.decisionThreshold, 0.41);
});

test("buildPredictionApiPayload respeta el flag experimental explícito", () => {
  assert.strictEqual(buildPredictionApiPayload(prediction({ experimental: false })).experimental, false);
  assert.strictEqual(buildPredictionApiPayload(prediction({ dataMode: "real" })).experimental, false);
  assert.strictEqual(buildPredictionApiPayload(prediction({ dataMode: "real", experimental: true })).experimental, true);
});
