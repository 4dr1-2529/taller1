import test from "node:test";
import assert from "node:assert/strict";
import {
  attachPredictions,
  globalRiskScore,
  averageGrade,
  buildRiskHistory,
  earlyAlertCount,
  riskTrendLabel,
} from "../src/lib/aggregates.js";

const makeStudent = (overrides: Record<string, unknown> = {}): any => ({
  id: "1",
  codigo: "E001",
  nombres: "Juan",
  apellidos: "Pérez",
  seccionId: "1",
  estado: "activo",
  promedioGeneral: 15,
  asistenciaGeneral: 90,
  activo: true,
  fechaIngreso: "2026-01-01",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  usuarioId: null,
  seccion: null,
  apoderados: [],
  matriculas: [],
  inscripciones: [],
  calificaciones: [],
  historialesAcademicos: [],
  asistencias: [],
  resumenesAsistencia: [],
  lmsActividades: [],
  lmsEntregasTarea: [],
  lmsIndicadores: [],
  predicciones: [],
  recomendaciones: [],
  alertas: [],
  auditorias: [],
  metrics: { promedioGeneral: 15, asistenciaGeneral: 90 },
  storedPrediction: null,
  ...overrides,
});

test("attachPredictions filtra solo estudiantes con predicción", () => {
  const s1 = makeStudent({ storedPrediction: { score: 80, level: "alto", probability: 0.8, factors: [], modelName: "M1" } });
  const s2 = makeStudent({ storedPrediction: null });
  const result = attachPredictions([s1, s2]);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "1");
});

test("globalRiskScore devuelve null sin estudiantes", () => {
  assert.strictEqual(globalRiskScore([]), null);
});

test("globalRiskScore devuelve null sin predicciones", () => {
  const s = makeStudent({ storedPrediction: null });
  assert.strictEqual(globalRiskScore([s]), null);
});

test("globalRiskScore promedia scores", () => {
  const s1 = makeStudent({ storedPrediction: { score: 80, level: "alto", probability: 0.8, factors: [], modelName: "M1" } });
  const s2 = makeStudent({ storedPrediction: { score: 60, level: "medio", probability: 0.6, factors: [], modelName: "M1" } });
  assert.strictEqual(globalRiskScore([s1, s2]), 70);
});

test("averageGrade devuelve null sin estudiantes con notas", () => {
  const s = makeStudent({ metrics: { promedioGeneral: null, asistenciaGeneral: null } });
  assert.strictEqual(averageGrade([s]), null);
});

test("averageGrade promedia notas", () => {
  const s1 = makeStudent({ metrics: { promedioGeneral: 15, asistenciaGeneral: 90 }, hasGrades: true });
  const s2 = makeStudent({ metrics: { promedioGeneral: 17, asistenciaGeneral: 85 }, hasGrades: true });
  assert.strictEqual(averageGrade([s1, s2]), 16);
});

test("buildRiskHistory devuelve [] sin predicciones", () => {
  const s = makeStudent({ storedPrediction: null });
  assert.deepStrictEqual(buildRiskHistory([s]), []);
});

test("buildRiskHistory devuelve punto con periodo actual", () => {
  const s = makeStudent({ storedPrediction: { score: 80, level: "alto", probability: 0.8, factors: [], modelName: "M1" } });
  const result = buildRiskHistory([s]);
  assert.strictEqual(result.length, 1);
  assert.ok(result[0].periodo.match(/^\d{4}-\d{2}$/));
  assert.strictEqual(result[0].riesgoGlobal, 80);
});

test("earlyAlertCount cuenta alto y medio", () => {
  const s1 = makeStudent({ storedPrediction: { score: 80, level: "alto", probability: 0.8, factors: [], modelName: "M1" } });
  const s2 = makeStudent({ storedPrediction: { score: 60, level: "medio", probability: 0.6, factors: [], modelName: "M1" } });
  const s3 = makeStudent({ storedPrediction: { score: 20, level: "bajo", probability: 0.2, factors: [], modelName: "M1" } });
  assert.strictEqual(earlyAlertCount([s1, s2, s3]), 2);
});

test("riskTrendLabel devuelve flat con menos de 2 puntos", () => {
  const result = riskTrendLabel([{ periodo: "2026-01", riesgoGlobal: 50 }]);
  assert.strictEqual(result.direction, "flat");
});

test("riskTrendLabel detecta subida", () => {
  const result = riskTrendLabel([
    { periodo: "2026-01", riesgoGlobal: 50 },
    { periodo: "2026-02", riesgoGlobal: 80 },
  ]);
  assert.strictEqual(result.direction, "up");
});

test("riskTrendLabel detecta bajada", () => {
  const result = riskTrendLabel([
    { periodo: "2026-01", riesgoGlobal: 80 },
    { periodo: "2026-02", riesgoGlobal: 40 },
  ]);
  assert.strictEqual(result.direction, "down");
});
