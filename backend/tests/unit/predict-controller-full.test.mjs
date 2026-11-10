import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { buildRecommendation, predict } = await import("../../src/controllers/predict.controller.js");

const makeReq = (overrides = {}) => ({ query: {}, params: {}, body: {}, user: undefined, ...overrides });
const makeRes = () => {
  const res = {
    status: (code) => ({ json: (body) => { res.body = body; res.statusCode = code; return res; } }),
    statusCode: 200,
    body: null,
  };
  return res;
};
const nextFn = (e) => { throw e; };

test("buildRecommendation prioriza recomendación ML y cubre los niveles de riesgo", () => {
  assert.equal(buildRecommendation("alto", [{ label: "asistencia" }], "Recomendación del modelo"), "Recomendación del modelo");
  assert.equal(buildRecommendation("alto", [{ label: "asistencia" }]), "Intervención prioritaria por asistencia. Coordinar tutoría y familia en 7 días.");
  assert.equal(buildRecommendation("medio", []), "Seguimiento preventivo: seguimiento general. Revisión quincenal en LMS y asistencia.");
  assert.equal(buildRecommendation("bajo", []), "Riesgo bajo. Mantener monitoreo rutinario.");
});

function mockPredictionPath({ grades = [{ _avg: { nota: 14 } }], attendance = [{ presente: true, tardanza: false, justificado: false }], mlStatus = 200 } = {}) {
  const restore = [];
  const replace = (target, key, implementation) => {
    const original = target[key];
    restore.push(() => { target[key] = original; });
    target[key] = implementation;
  };
  const student = {
    id: 42n, activo: true, seccionId: 9n,
    seccion: { id: 9n, nombre: "A", grado: { numero: 2, nombre: "Segundo", nivel: { codigo: "primaria" } } },
  };
  replace(prisma.student, "findUnique", async () => student);
  replace(prisma.student, "findFirst", async () => ({ id: student.id }));
  replace(prisma.lmsEvent, "findMany", async () => [{ tipo: "login", resourceId: 2n, durationSeconds: 180, createdAt: new Date("2026-03-01T12:00:00Z") }]);
  replace(prisma.activityProgress, "count", async () => 2);
  replace(prisma.grade, "groupBy", async () => grades);
  replace(prisma.attendance, "findMany", async () => attendance);
  const tx = {
    $queryRaw: async () => [],
    student: { findUniqueOrThrow: async () => ({ nombres: "Ana", apellidos: "Uno" }) },
    prediction: { create: async () => ({ id: 555n }) },
    auditLog: { create: async () => undefined },
    systemConfig: { findUnique: async () => ({ valor: "alto" }) },
    alert: {
      findFirst: async () => null,
      create: async () => ({ id: 777n, nivelRiesgo: "alto" }),
    },
    alertaHistorial: { create: async () => undefined },
    user: { findMany: async () => [{ id: 1n }, { id: 2n }] },
    notification: { createMany: async () => undefined },
    aiRecommendation: { create: async () => undefined },
  };
  replace(prisma, "$transaction", async (callback) => callback(tx));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    score: 80, level: "alto", probability: 0.7, probability_abandono: 0.7,
    model_name: "random_forest", recommendation: "", prediction_source: "ml_model",
    factors: [{ key: "asistencia", label: "Asistencia", contribution: 0.4 }],
    modelVersion: "v6", datasetVersion: "2026-v6", dataMode: "synthetic_scientific",
    contractVersion: "2026-v3", decisionThreshold: 0.65,
  }), { status: mlStatus, headers: { "content-type": "application/json" } });
  restore.push(() => { globalThis.fetch = originalFetch; });
  return { restore: () => restore.reverse().forEach((fn) => fn()), student };
}

test("predict: rechaza body inválido", async () => {
  const res = makeRes();
  let error;
  try {
    await predict({ body: {}, user: { sub: "1", role: "estudiante" } }, res, nextFn);
  } catch (e) { error = e; }
  assert.ok(error);
});

test("predict: rechaza body vacío con error de validación", async () => {
  const res = makeRes();
  let error;
  try {
    await predict({ body: {}, user: { sub: "1", role: "docente" } }, res, nextFn);
  } catch (e) { error = e; }
  assert.ok(error);
});

test("predict: valida el identificador y devuelve 404 cuando no existe el estudiante", async () => {
  const invalidRes = makeRes();
  let validationError;
  try {
    await predict(makeReq({ body: { studentId: "0" }, user: { sub: "1", role: "admin" } }), invalidRes, nextFn);
  } catch (error) { validationError = error; }
  assert.ok(validationError);

  const original = mockPrisma(prisma.student, "findUnique", async () => null);
  try {
    const res = makeRes();
    let error;
    try {
      await predict(makeReq({ body: { studentId: "42" }, user: { sub: "1", role: "admin" } }), res, (value) => { error = value; });
    } catch (value) { error = value; }
    assert.equal(error?.statusCode, 404);
  } finally {
    prisma.student.findUnique = original;
  }
});

test("predict: calcula, persiste y devuelve predicción V6 con alerta", async () => {
  const { restore, student } = mockPredictionPath();
  try {
    const res = makeRes();
    const errors = [];
    await predict(makeReq({ body: { studentId: String(student.id) }, user: { sub: "1", role: "admin" }, ip: "127.0.0.1" }), res, (error) => errors.push(error));
    assert.deepEqual(errors, []);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.prediction.id, "555");
    assert.equal(res.body.data.prediction.modelVersion, "v6");
    assert.match(res.body.data.prediction.recommendation, /Intervención prioritaria/);
    assert.equal(res.body.data.alert.id, "777");
    assert.equal(res.body.data.source, "machine-learning");
  } finally { restore(); }
});

test("predict: valida métricas académicas insuficientes antes de llamar al modelo", async () => {
  const { restore, student } = mockPredictionPath({ grades: [], attendance: [] });
  try {
    const errors = [];
    await predict(makeReq({ body: { studentId: String(student.id) }, user: { sub: "1", role: "admin" } }), makeRes(), (error) => errors.push(error));
    assert.equal(errors[0]?.statusCode, 409);
    assert.match(errors[0]?.message, /Datos académicos insuficientes/);
  } finally { restore(); }
});

test("predict: informa indisponibilidad del modelo sin generar un riesgo ficticio", async () => {
  const { restore, student } = mockPredictionPath({ mlStatus: 503 });
  try {
    const errors = [];
    await predict(makeReq({ body: { studentId: String(student.id) }, user: { sub: "1", role: "admin" } }), makeRes(), (error) => errors.push(error));
    assert.equal(errors[0]?.statusCode, 503);
    assert.match(errors[0]?.message, /No se genera riesgo ficticio/);
  } finally { restore(); }
});
