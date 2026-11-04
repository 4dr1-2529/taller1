import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { buildMlPayload, getMlHealth, getMlMetrics, predictWithMl } from "../../src/services/ml-client.js";

const originalFetch = globalThis.fetch;
const metrics = {
  promedio_general: 14,
  cursos_desaprobados: 1,
  asistencia_general: 87,
  frecuencia_acceso_lms: 3,
  tiempo_interaccion_lms: 12,
  actividades_realizadas: 5,
  recursos_consultados: 8,
  internalOnly: "not sent",
};

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("buildMlPayload envía solo las siete variables del contrato", () => {
  assert.deepStrictEqual(buildMlPayload(metrics), {
    promedio_general: 14,
    cursos_desaprobados: 1,
    asistencia_general: 87,
    frecuencia_acceso_lms: 3,
    tiempo_interaccion_lms: 12,
    actividades_realizadas: 5,
    recursos_consultados: 8,
  });
});

test("predictWithMl valida la respuesta v3 y normaliza decision_threshold", async () => {
  let request;
  globalThis.fetch = async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({
      score: 72,
      level: "alto",
      probability: 0.72,
      probability_abandono: 0.72,
      model_name: "random-forest",
      recommendation: "Seguimiento prioritario",
      prediction_source: "ml_model",
      factors: [{ key: "asistencia", label: "Baja asistencia", contribution: 8 }],
      decision_threshold: 0.65,
      dataMode: "synthetic_scientific",
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const result = await predictWithMl(buildMlPayload(metrics));
  assert.strictEqual(result.level, "alto");
  assert.strictEqual(result.decisionThreshold, 0.65);
  assert.strictEqual(request.init.method, "POST");
  assert.strictEqual(request.init.headers["Content-Type"], "application/json");
  assert.ok(request.url.endsWith("/predict"));
  assert.deepStrictEqual(JSON.parse(request.init.body), buildMlPayload(metrics));
});

test("predictWithMl devuelve null ante HTTP no exitoso, contrato inválido o error de red", async (t) => {
  await t.test("HTTP no exitoso", async () => {
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    assert.strictEqual(await predictWithMl(buildMlPayload(metrics)), null);
  });
  await t.test("respuesta fuera del contrato", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ score: 101 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    assert.strictEqual(await predictWithMl(buildMlPayload(metrics)), null);
  });
  await t.test("red rechazada", async () => {
    globalThis.fetch = async () => { throw new Error("connection refused"); };
    assert.strictEqual(await predictWithMl(buildMlPayload(metrics)), null);
  });
});

test("getMlMetrics y getMlHealth aceptan respuestas JSON y degradan ante fallos", async (t) => {
  await t.test("métricas y salud disponibles", async () => {
    globalThis.fetch = async (url) => new Response(
      JSON.stringify(url.endsWith("/metrics") ? { accuracy: 0.9 } : { status: "healthy", modelLoaded: true }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
    assert.deepStrictEqual(await getMlMetrics(), { accuracy: 0.9 });
    assert.deepStrictEqual(await getMlHealth(), { status: "healthy", modelLoaded: true });
  });
  await t.test("HTTP no exitoso y error de red", async () => {
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    assert.strictEqual(await getMlMetrics(), null);
    assert.strictEqual(await getMlHealth(), null);
    globalThis.fetch = async () => { throw new Error("connection refused"); };
    assert.strictEqual(await getMlMetrics(), null);
    assert.strictEqual(await getMlHealth(), null);
  });
});
