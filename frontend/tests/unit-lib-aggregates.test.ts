import test from "node:test";
import assert from "node:assert/strict";
import {
  attachPredictions,
  globalRiskScore,
  averageGrade,
  averageAttendance,
  averageLmsParticipation,
  buildRiskHistory,
  earlyAlertCount,
  riskTrendLabel,
  studentsInCourseSalon,
  riskByCourse,
} from "../src/lib/aggregates.js";

const student = (overrides: any = {}) => ({
  id: "s-1",
  codigo: "0001",
  nombres: "Ana",
  apellidos: "García",
  estado: "activa",
  seccionId: "sec-1",
  hasGrades: true,
  hasAttendance: true,
  metrics: {
    promedioGeneral: 14,
    asistenciaGeneral: 90,
    lms: { actividadSemanalPct: [50, 80] },
  },
  storedPrediction: {
    score: 70,
    level: "medio",
    probability: 0.7,
    factors: [
      { key: "asistencia", label: "Asistencia", contribution: 25 },
      { key: "nota", label: "Nota", contribution: 8 },
    ],
    modelName: "Modelo X",
  },
  enrolledCourseIds: ["c-1"],
  ...overrides,
});

test("attachPredictions mapea factores con severidad", () => {
  const out = attachPredictions([student()]);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].prediction.score, 70);
  assert.strictEqual(out[0].prediction.level, "medio");
  assert.strictEqual(out[0].prediction.factors[0].severity, "alta");
  assert.strictEqual(out[0].prediction.factors[1].severity, "baja");
});

test("attachPredictions ignora estudiantes sin predicción", () => {
  const out = attachPredictions([student({ storedPrediction: undefined })]);
  assert.deepStrictEqual(out, []);
});

test("mapStoredFactors clasifica severidad media", () => {
  const out = attachPredictions([student({ storedPrediction: { ...student().storedPrediction, factors: [{ key: "x", label: "X", contribution: 15 }] } })]);
  assert.strictEqual(out[0].prediction.factors[0].severity, "media");
});

test("probabilidad respeta score/100 cuando probability falta", () => {
  const s = student({ storedPrediction: { ...student().storedPrediction, probability: undefined } });
  const out = attachPredictions([s]);
  assert.strictEqual(out[0].prediction.probability, 0.7);
});

test("globalRiskScore promedia y redondea", () => {
  assert.strictEqual(globalRiskScore([student({ storedPrediction: { score: 80, level: "alto", probability: 0.8, factors: [], modelName: "m" } })]), 80);
  assert.strictEqual(globalRiskScore([]), null);
  assert.strictEqual(globalRiskScore([student({ storedPrediction: undefined })]), null);
});

test("averageGrade solo cuenta notas", () => {
  assert.strictEqual(
    averageGrade([student({ metrics: { promedioGeneral: 16, asistenciaGeneral: 90, lms: { actividadSemanalPct: [] } }, hasGrades: true }), student({ hasGrades: false })]),
    16,
  );
  assert.strictEqual(averageGrade([student({ hasGrades: false })]), null);
});

test("averageAttendance y averageLmsParticipation", () => {
  assert.strictEqual(averageAttendance([student(), student({ hasAttendance: false })]), 90);
  assert.strictEqual(averageAttendance([]), null);
  assert.strictEqual(averageLmsParticipation([student()]), 65);
  assert.strictEqual(averageLmsParticipation([student({ metrics: { promedioGeneral: 0, asistenciaGeneral: 0, lms: { actividadSemanalPct: [] } } })]), 0);
  assert.strictEqual(averageLmsParticipation([]), 0);
});

test("buildRiskHistory devuelve [] sin score", () => {
  assert.deepStrictEqual(buildRiskHistory([student({ storedPrediction: undefined })]), []);
  const out = buildRiskHistory([student()]);
  assert.strictEqual(out.length, 1);
  assert.ok(/^\d{4}-\d{2}$/.test(out[0].periodo));
  assert.strictEqual(out[0].riesgoGlobal, 70);
});

test("earlyAlertCount cuenta niveles alto y medio", () => {
  assert.strictEqual(
    earlyAlertCount([
      student({ storedPrediction: { score: 90, level: "alto", probability: 0.9, factors: [], modelName: "m" } }),
      student({ storedPrediction: { score: 50, level: "medio", probability: 0.5, factors: [], modelName: "m" } }),
      student({ storedPrediction: { score: 10, level: "bajo", probability: 0.1, factors: [], modelName: "m" } }),
    ]),
    2,
  );
});

test("riskTrendLabel clasifica dirección de tendencia", () => {
  assert.deepStrictEqual(riskTrendLabel([{ periodo: "2026-01", riesgoGlobal: 40 }]), {
    direction: "flat",
    label: "Registre más periodos para ver tendencia",
    delta: 0,
  });
  assert.deepStrictEqual(riskTrendLabel([{ periodo: "2026-01", riesgoGlobal: 40 }, { periodo: "2026-02", riesgoGlobal: 60 }]), {
    direction: "up",
    label: "El riesgo global sube",
    delta: 20,
  });
  assert.deepStrictEqual(riskTrendLabel([{ periodo: "2026-01", riesgoGlobal: 60 }, { periodo: "2026-02", riesgoGlobal: 40 }]), {
    direction: "down",
    label: "El riesgo global baja",
    delta: -20,
  });
  assert.deepStrictEqual(riskTrendLabel([{ periodo: "2026-01", riesgoGlobal: 40 }, { periodo: "2026-02", riesgoGlobal: 40 }]), {
    direction: "flat",
    label: "Riesgo estable",
    delta: 0,
  });
});

test("studentsInCourseSalon usa enrolledCourseIds o sección", () => {
  const c = { id: "c-1", seccionId: "sec-1" } as any;
  const withIds = [student(), student({ enrolledCourseIds: ["c-2"] })];
  assert.strictEqual(studentsInCourseSalon(withIds, c).length, 1);
  const withoutIds = [student({ enrolledCourseIds: undefined }), student({ enrolledCourseIds: undefined, seccionId: "otra" })];
  assert.strictEqual(studentsInCourseSalon(withoutIds, c).length, 1);
  assert.strictEqual(studentsInCourseSalon([student({ enrolledCourseIds: undefined, seccionId: undefined })], { ...c, seccionId: undefined }).length, 1);
});

test("riskByCourse promedia por curso", () => {
  const c1 = { id: "c-1", nombre: "Matemática", seccionId: "sec-1" } as any;
  const c2 = { id: "c-2", nombre: "Historia", seccionId: "sec-9" } as any;
  const rows = riskByCourse([student(), student({ enrolledCourseIds: ["c-1"] })], [c1, c2]);
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[0].estudiantes, 2);
  assert.strictEqual(rows[0].riesgoPromedio, 70);
  assert.strictEqual(rows[1].riesgoPromedio, null);
  assert.strictEqual(rows[1].estudiantes, 0);
});
