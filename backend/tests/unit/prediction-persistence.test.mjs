import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { persistPrediction } from "../../src/services/prediction-persistence.service.js";

const studentId = 42n;
const baseResult = {
  score: 81,
  level: "alto",
  probabilityAbandono: 0.81234,
  modelName: "RandomForest",
  recommendation: "Contactar al estudiante",
  inputData: { promedio_general: 13, asistencia_general: 71, nota_text: "ok" },
  factors: [{ key: "asistencia", label: "Asistencia baja", contribution: 8 }],
};

function setup({ config = null, existingAlert = null, staff = [] } = {}) {
  const calls = { query: [], student: [], prediction: [], audit: [], alertSearch: [], alert: [], history: [], users: [], notifications: [], recommendations: [] };
  const tx = {
    $queryRaw: async (...args) => { calls.query.push(args); return []; },
    student: { findUniqueOrThrow: async (args) => { calls.student.push(args); return { nombres: "Ana", apellidos: "Pérez" }; } },
    prediction: { create: async (args) => { calls.prediction.push(args); return { id: 900n, ...args.data }; } },
    auditLog: { create: async (args) => { calls.audit.push(args); return {}; } },
    systemConfig: { findUnique: async () => config },
    alert: {
      findFirst: async (args) => { calls.alertSearch.push(args); return existingAlert; },
      create: async (args) => { calls.alert.push(args); return { id: 901n, ...args.data }; },
    },
    alertaHistorial: { create: async (args) => { calls.history.push(args); return {}; } },
    user: { findMany: async (args) => { calls.users.push(args); return staff; } },
    notification: { createMany: async (args) => { calls.notifications.push(args); return {}; } },
    aiRecommendation: { create: async (args) => { calls.recommendations.push(args); return {}; } },
  };
  const original = prisma.$transaction;
  prisma.$transaction = async (callback, options) => { calls.options = options; return callback(tx); };
  return { calls, restore: () => { prisma.$transaction = original; } };
}

test("persistPrediction serializa la creación, conserva trazabilidad y crea alerta con notificaciones", async () => {
  const { calls, restore } = setup({ staff: [{ id: 4n }, { id: 5n }] });
  try {
    const result = await persistPrediction(studentId, {
      ...baseResult,
      modelVersion: "v6", datasetVersion: "ds-2026", dataMode: "real",
      contractVersion: "2026-v3-long-version", decisionThreshold: 0.65,
    }, "7", "10.0.0.5");
    const data = calls.prediction[0].data;
    assert.deepStrictEqual(data.inputData, {
      ...baseResult.inputData, modelVersion: "v6", datasetVersion: "ds-2026",
      dataMode: "real", contractVersion: "2026-v3-long-version", decisionThreshold: 0.65,
    });
    assert.strictEqual(data.contractVersion, "2026-v3-long-version".slice(0, 20));
    assert.deepStrictEqual(data.features.create, [
      { featureCodigo: "promedio_general", valorNumerico: 13 },
      { featureCodigo: "asistencia_general", valorNumerico: 71 },
    ]);
    assert.strictEqual(calls.query.length, 1);
    assert.deepStrictEqual(calls.options, { timeout: 15000 });
    assert.strictEqual(calls.alert.length, 1);
    assert.match(calls.alert[0].data.descripcion, /81\.2%/);
    assert.strictEqual(calls.history.length, 1);
    assert.strictEqual(calls.audit.length, 2);
    assert.deepStrictEqual(calls.notifications[0].data.map(n => n.usuarioId), [4n, 5n]);
    assert.strictEqual(result.alert.id, 901n);
    assert.strictEqual(calls.recommendations.length, 1);
  } finally { restore(); }
});

test("persistPrediction omite alerta para riesgo bajo y usa version contractual por defecto", async () => {
  const { calls, restore } = setup({ config: { valor: "alto" } });
  try {
    const result = await persistPrediction(studentId, { ...baseResult, level: "bajo" }, "7");
    assert.strictEqual(calls.prediction[0].data.contractVersion, "2026-v2");
    assert.deepStrictEqual(calls.prediction[0].data.inputData, baseResult.inputData);
    assert.strictEqual(calls.alertSearch.length, 0);
    assert.strictEqual(calls.alert.length, 0);
    assert.strictEqual(result.alert, null);
    assert.strictEqual(calls.recommendations.length, 1);
    assert.strictEqual(calls.audit[0].data.ipAddress, undefined);
  } finally { restore(); }
});

test("persistPrediction aplica umbral medio predeterminado y evita duplicar alertas activas", async () => {
  const { calls, restore } = setup({ existingAlert: { id: 88n } });
  try {
    const result = await persistPrediction(studentId, { ...baseResult, level: "medio" }, "7");
    assert.strictEqual(calls.alertSearch.length, 1);
    assert.deepStrictEqual(calls.alertSearch[0].where.estado.in, ["nueva", "en_seguimiento"]);
    assert.strictEqual(calls.alert.length, 0);
    assert.strictEqual(calls.history.length, 0);
    assert.strictEqual(calls.users.length, 0);
    assert.strictEqual(result.alert, null);
  } finally { restore(); }
});
