import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { buildDashboardAnalytics } from "../../src/services/dashboard-analytics.service.js";

const methods = [
  ["student", "count"], ["teacher", "count"], ["seccion", "count"],
  ["alert", "count"], ["alert", "groupBy"], ["prediction", "findMany"],
  ["prediction", "aggregate"], ["student", "findMany"], ["seccion", "findMany"],
  ["grade", "groupBy"], ["attendance", "findMany"], ["alert", "findMany"],
  ["systemConfig", "findUnique"], ["user", "findFirst"],
];

function installMocks({ empty = false } = {}) {
  const original = new Map();
  const values = {
    "student.count": 4, "teacher.count": 2, "seccion.count": 3, "alert.count": 3,
    "alert.groupBy": [
      { nivelRiesgo: "alto", _count: 2 }, { nivelRiesgo: "medio", _count: 1 },
    ],
    "prediction.findMany": [
      { score: 40, createdAt: new Date("2026-01-15T00:00:00Z") },
      { score: 60, createdAt: new Date("2026-02-15T00:00:00Z") },
    ],
    "prediction.aggregate": { _avg: { score: 51.25 } },
    "student.findMany": [
      { id: 1n, codigo: "A1", nombres: "Ana", apellidos: "Uno", seccionId: 10n,
        seccion: { nombre: "A", grado: { numero: 1, nombre: "1°", nivel: { nombre: "Primaria" } } },
        predicciones: [{ nivelRiesgo: "alto", score: 80, probabilidadAbandono: 0.8 }] },
      { id: 2n, codigo: "B2", nombres: "Beto", apellidos: "Dos", seccionId: 10n,
        seccion: { nombre: "A", grado: { numero: 1, nombre: "1°", nivel: { nombre: "Primaria" } } },
        predicciones: [{ nivelRiesgo: "medio", score: 50, probabilidadAbandono: 0.5 }] },
      { id: 3n, codigo: "C3", nombres: "Ceci", apellidos: "Tres", seccionId: 20n,
        seccion: { nombre: "B", grado: { numero: null, nombre: "2° Secundaria", nivel: null } },
        predicciones: [{ nivelRiesgo: "bajo", score: 20, probabilidadAbandono: null }] },
      { id: 4n, codigo: "D4", nombres: "Dani", apellidos: "Cuatro", seccionId: null,
        seccion: null, predicciones: [] },
    ],
    "seccion.findMany": [],
    "grade.groupBy": [
      { studentId: 1n, cursoOfertaId: 1n, _avg: { nota: 14 } },
      { studentId: 1n, cursoOfertaId: 2n, _avg: { nota: 16 } },
      { studentId: 2n, cursoOfertaId: 1n, _avg: { nota: 10 } },
    ],
    "attendance.findMany": [
      { studentId: 1n, presente: true, tardanza: false, justificado: false },
      { studentId: 1n, presente: false, tardanza: true, justificado: false },
      { studentId: 2n, presente: false, tardanza: false, justificado: false },
      { studentId: 2n, presente: false, tardanza: false, justificado: true },
    ],
    "alert.findMany": [
      { student: { seccion: { nombre: "A", grado: { numero: 1 } } } },
      { student: { seccion: { nombre: "A", grado: { numero: 1 } } } },
      { student: { seccion: null } },
    ],
    "systemConfig.findUnique": { valor: "Colegio de prueba" },
    "user.findFirst": { nombres: "Dora", apellidos: "Luz", email: "dora@example.test" },
  };
  if (empty) {
    for (const key of Object.keys(values)) {
      if (key.endsWith(".count")) values[key] = 0;
      else if (key === "prediction.aggregate") values[key] = { _avg: { score: null } };
      else if (key === "systemConfig.findUnique" || key === "user.findFirst") values[key] = null;
      else values[key] = [];
    }
  }
  for (const [model, method] of methods) {
    const key = `${model}.${method}`;
    original.set(key, prisma[model][method]);
    prisma[model][method] = async (args) => {
      if (key === "student.findMany" && args?.select?.resourceEvents) {
        if (empty) return [];
        const day = new Date("2026-05-01T00:00:00Z");
        return [
          { seccion: { grado: { numero: 1 } }, resourceEvents: Array.from({ length: 20 }, (_, i) => ({ createdAt: new Date(day.getTime() + i * 86400000) })) },
          { seccion: { grado: { numero: 1 } }, resourceEvents: Array.from({ length: 10 }, (_, i) => ({ createdAt: new Date(day.getTime() + i * 86400000) })) },
          { seccion: { grado: { numero: 2 } }, resourceEvents: [] },
        ];
      }
      return values[key];
    };
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(empty ? {} : {
    data_mode: "real", dataset_version: "2026.1", model_version: "v6",
    best_model: "random_forest", contract_version: "v3", decision_threshold: 0.65,
    risk_thresholds: { medio: 0.41 }, n_features: 7,
    random_forest: { f1_score: 0.8, accuracy: 0.9 }, xgboost: { accuracy: 0.85 },
    feature_importance: { asistencia: 0.6, promedio: 0.4 },
  }), { status: 200, headers: { "content-type": "application/json" } });
  return () => {
    for (const [key, fn] of original) {
      const [model, method] = key.split(".");
      prisma[model][method] = fn;
    }
    globalThis.fetch = originalFetch;
  };
}

test("buildDashboardAnalytics agrega métricas, niveles, periodos, salones y metadatos ML", async () => {
  const restore = installMocks();
  try {
    const result = await buildDashboardAnalytics({ activo: true });
    assert.deepStrictEqual(result.kpis, {
      totalStudents: 4, totalTeachers: 2, totalSalones: 3, openAlerts: 3,
      avgRisk: 51.3, avgGrade: 12.5, avgAttendance: 50,
      byLevel: { bajo: 1, medio: 1, alto: 1 },
      alertsByLevel: { alto: 2, medio: 1 },
      institutionName: "Colegio de prueba", directorName: "Dora Luz", directorEmail: "dora@example.test",
    });
    assert.deepStrictEqual(result.riskTrend, [
      { periodo: "2026-01", riesgoGlobal: 40, count: 1 },
      { periodo: "2026-02", riesgoGlobal: 60, count: 1 },
    ]);
    assert.deepStrictEqual(result.riskByGrado, [
      { grado: "1°", alto: 1, medio: 1, bajo: 0 },
      { grado: "2°", alto: 0, medio: 0, bajo: 1 },
    ]);
    assert.deepStrictEqual(result.attendanceByGrado, [
      { grado: "1°", asistencia: 50 },
    ]);
    assert.deepStrictEqual(result.alertsBySalonShort, [{ salon: "1°A", count: 2 }]);
    assert.strictEqual(result.riskBySection.length, 3);
    assert.strictEqual(result.riskBySection[0].label, "Primaria 1° A");
    assert.strictEqual(result.ml.experimental, false);
    assert.strictEqual(result.ml.evaluated, 3);
    assert.strictEqual(result.ml.avgProbability, 0.65);
    assert.deepStrictEqual(result.modelComparison, [
      { modelo: "random forest", f1: 80, accuracy: 90 },
    ]);
    assert.deepStrictEqual(result.featureImportance, [
      { variable: "asistencia", peso: 0.6 }, { variable: "promedio", peso: 0.4 },
    ]);
  } finally { restore(); }
});

test("buildDashboardAnalytics representa sin datos sin inventar promedios o metadatos", async () => {
  const restore = installMocks({ empty: true });
  try {
    const result = await buildDashboardAnalytics({});
    assert.strictEqual(result.kpis.avgRisk, null);
    assert.strictEqual(result.kpis.avgGrade, null);
    assert.strictEqual(result.kpis.avgAttendance, null);
    assert.strictEqual(result.kpis.institutionName, "I.E.P. Blenkir");
    assert.strictEqual(result.kpis.directorName, null);
    assert.deepStrictEqual(result.riskTrend, []);
    assert.deepStrictEqual(result.riskBySection, []);
    assert.deepStrictEqual(result.attendanceByGrado, []);
    assert.strictEqual(result.ml.metricsAvailable, true);
    assert.strictEqual(result.ml.dataMode, null);
    assert.deepStrictEqual(result.modelComparison, []);
    assert.deepStrictEqual(result.featureImportance, []);
  } finally { restore(); }
});
