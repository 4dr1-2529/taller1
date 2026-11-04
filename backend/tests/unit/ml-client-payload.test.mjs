import test from "node:test";
import assert from "node:assert/strict";
import { buildMlPayload } from "../../src/services/ml-client.js";

const metrics = {
  promedio_general: 14.5,
  cursos_desaprobados: 2,
  asistencia_general: 85,
  frecuencia_acceso_lms: 4,
  tiempo_interaccion_lms: 120,
  actividades_realizadas: 10,
  recursos_consultados: 5,
};

test("buildMlPayload mapea todas las métricas al contrato ML", () => {
  const payload = buildMlPayload(metrics);
  assert.strictEqual(payload.promedio_general, 14.5);
  assert.strictEqual(payload.cursos_desaprobados, 2);
  assert.strictEqual(payload.asistencia_general, 85);
  assert.strictEqual(payload.frecuencia_acceso_lms, 4);
  assert.strictEqual(payload.tiempo_interaccion_lms, 120);
  assert.strictEqual(payload.actividades_realizadas, 10);
  assert.strictEqual(payload.recursos_consultados, 5);
});
