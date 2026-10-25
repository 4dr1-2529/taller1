import test from "node:test";
import assert from "node:assert/strict";
import {
  globalRiskScore,
  averageGrade,
  buildRiskHistory,
  earlyAlertCount,
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

test("globalRiskScore con un estudiante", () => {
  const s = makeStudent({ storedPrediction: { score: 75, level: "medio", probability: 0.75, factors: [], modelName: "M1" } });
  assert.strictEqual(globalRiskScore([s]), 75);
});

test("averageGrade con un estudiante", () => {
  const s = makeStudent({ metrics: { promedioGeneral: 16, asistenciaGeneral: 80 }, hasGrades: true });
  assert.strictEqual(averageGrade([s]), 16);
});

test("averageGrade con múltiples estudiantes", () => {
  const s1 = makeStudent({ metrics: { promedioGeneral: 10, asistenciaGeneral: 80 }, hasGrades: true });
  const s2 = makeStudent({ metrics: { promedioGeneral: 20, asistenciaGeneral: 90 }, hasGrades: true });
  assert.strictEqual(averageGrade([s1, s2]), 15);
});

test("buildRiskHistory con predicción", () => {
  const s = makeStudent({ storedPrediction: { score: 85, level: "alto", probability: 0.85, factors: [], modelName: "M1" } });
  const result = buildRiskHistory([s]);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].riesgoGlobal, 85);
});

test("earlyAlertCount con solo alto", () => {
  const s = makeStudent({ storedPrediction: { score: 90, level: "alto", probability: 0.9, factors: [], modelName: "M1" } });
  assert.strictEqual(earlyAlertCount([s]), 1);
});

test("earlyAlertCount con solo medio", () => {
  const s = makeStudent({ storedPrediction: { score: 55, level: "medio", probability: 0.55, factors: [], modelName: "M1" } });
  assert.strictEqual(earlyAlertCount([s]), 1);
});

test("earlyAlertCount con solo bajo", () => {
  const s = makeStudent({ storedPrediction: { score: 20, level: "bajo", probability: 0.2, factors: [], modelName: "M1" } });
  assert.strictEqual(earlyAlertCount([s]), 0);
});
