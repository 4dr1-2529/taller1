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

function installMocks({ empty = false, overrides = {}, metrics, metricsUnavailable = false, lmsRows } = {}) {
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
  Object.assign(values, overrides);
  for (const [model, method] of methods) {
    const key = `${model}.${method}`;
    original.set(key, prisma[model][method]);
    prisma[model][method] = async (args) => {
      if (key === "student.findMany" && args?.select?.resourceEvents) {
        if (lmsRows) return lmsRows;
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
  globalThis.fetch = async (url) => {
    if (metricsUnavailable && String(url).endsWith("/metrics")) throw new Error("ML temporalmente fuera de servicio");
    return new Response(JSON.stringify(metrics ?? (empty ? {} : {
    data_mode: "real", dataset_version: "2026.1", model_version: "v6",
    best_model: "random_forest", contract_version: "v3", decision_threshold: 0.65,
    risk_thresholds: { medio: 0.41 }, n_features: 7,
    random_forest: { f1_score: 0.8, accuracy: 0.9 }, xgboost: { accuracy: 0.85 },
    feature_importance: { asistencia: 0.6, promedio: 0.4 },
    })), { status: 200, headers: { "content-type": "application/json" } });
  };
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

test("buildDashboardAnalytics cubre metadata V6, rangos LMS y promedios sin asistencia computable", async () => {
  const restore = installMocks({
    overrides: {
      "student.findMany": [
        { id: 1n, codigo: "A1", nombres: "Ana", apellidos: "Uno", seccionId: 10n,
          seccion: { nombre: "A", grado: { numero: 1, nombre: "Primero", nivel: { nombre: "Primaria" } } },
          predicciones: [{ nivelRiesgo: "alto", score: 80, probabilidadAbandono: 0.81234 }] },
        { id: 2n, codigo: "B2", nombres: "Beto", apellidos: "Dos", seccionId: 20n,
          seccion: { nombre: "B", grado: { numero: null, nombre: "2° Secundaria", nivel: null } },
          predicciones: [{ nivelRiesgo: "medio", score: 50, probabilidadAbandono: null }] },
        { id: 3n, codigo: "C3", nombres: "Ceci", apellidos: "Tres", seccionId: null,
          seccion: null, predicciones: [] },
      ],
      "grade.groupBy": [{ studentId: 1n, cursoOfertaId: 1n, _avg: { nota: 0 } }],
      "attendance.findMany": [
        { studentId: 1n, presente: false, tardanza: true, justificado: false },
        { studentId: 2n, presente: true, tardanza: false, justificado: true },
      ],
    },
    metrics: {
      data_mode: "synthetic_scientific", dataset_version: "2026.1", model_version: "v6",
      best_model: "stacking", contract_version: "v3", decision_threshold: 0.5,
      risk_thresholds: { bajo: 0.2, medio: 0.5 }, n_features: 7,
      random_forest: { f1_score: 0.81234 },
      hist_gradient_boosting: { f1_score: 0.7, accuracy: 0.78 },
      stacking: { f1_score: 0.9, accuracy: 0.92 },
      feature_importance: { asistencia: 0.75 },
    },
  });
  try {
    const result = await buildDashboardAnalytics({ activo: true });
    assert.equal(result.kpis.avgGrade, 0);
    assert.equal(result.kpis.avgAttendance, 100);
    assert.deepEqual(result.riskByGrado, [
      { grado: "1°", alto: 1, medio: 0, bajo: 0 },
      { grado: "2°", alto: 0, medio: 1, bajo: 0 },
    ]);
    assert.deepEqual(result.lmsActivityByGrado, [
      { grado: "1°", alta: 1, media: 0, baja: 1, sin: 0 },
      { grado: "2°", alta: 0, media: 0, baja: 0, sin: 1 },
    ]);
    assert.equal(result.ml.experimental, true);
    assert.equal(result.ml.avgProbability, 0.812);
    assert.deepEqual(result.ml.prioritized.map((row) => row.studentId), ["1", "2"]);
    assert.deepEqual(result.modelComparison, [
      { modelo: "random forest", f1: 81.2, accuracy: 0 },
      { modelo: "hist gradient boosting", f1: 70, accuracy: 78 },
      { modelo: "stacking", f1: 90, accuracy: 92 },
    ]);
  } finally { restore(); }
});

test("buildDashboardAnalytics cubre cada nivel de actividad LMS en el límite correcto", async () => {
  const day = new Date("2026-05-01T00:00:00Z");
  const lmsRows = [
    { seccion: { grado: { numero: 3 } }, resourceEvents: Array.from({ length: 20 }, (_, i) => ({ createdAt: new Date(day.getTime() + i * 86400000) })) },
    { seccion: { grado: { numero: 4 } }, resourceEvents: Array.from({ length: 12 }, (_, i) => ({ createdAt: new Date(day.getTime() + i * 86400000) })) },
    { seccion: { grado: { numero: 5 } }, resourceEvents: [{ createdAt: day }] },
    { seccion: { grado: { numero: 6 } }, resourceEvents: [] },
    { seccion: { grado: { numero: 0 } }, resourceEvents: [{ createdAt: day }] },
  ];
  const restore = installMocks({ empty: true, lmsRows });
  try {
    const result = await buildDashboardAnalytics({});
    assert.deepEqual(result.lmsActivityByGrado, [
      { grado: "3°", alta: 1, media: 0, baja: 0, sin: 0 },
      { grado: "4°", alta: 0, media: 1, baja: 0, sin: 0 },
      { grado: "5°", alta: 0, media: 0, baja: 1, sin: 0 },
      { grado: "6°", alta: 0, media: 0, baja: 0, sin: 1 },
    ]);
  } finally { restore(); }
});

test("buildDashboardAnalytics preserva los KPIs cuando ML no está disponible", async () => {
  const restore = installMocks({ empty: true, metricsUnavailable: true });
  try {
    const result = await buildDashboardAnalytics({});
    assert.equal(result.ml.metricsAvailable, false);
    assert.equal(result.ml.dataMode, null);
    assert.equal(result.ml.datasetVersion, null);
    assert.deepEqual(result.modelComparison, []);
    assert.deepEqual(result.featureImportance, []);
    assert.equal(result.kpis.totalStudents, 0);
  } finally { restore(); }
});

test("buildDashboardAnalytics conserva salidas vacías con relaciones y metadatos parciales", async () => {
  const restore = installMocks({
    empty: true,
    overrides: {
      "student.findMany": [{
        id: 9n,
        codigo: "S9",
        nombres: "Eva",
        apellidos: "Cruz",
        seccionId: 90n,
        seccion: { nombre: "B", grado: { numero: null, nombre: "Inicial", nivel: null } },
        predicciones: [{ nivelRiesgo: null, score: null, probabilidadAbandono: null }],
      }],
      "prediction.findMany": [],
      "grade.groupBy": [],
      "attendance.findMany": [
        { studentId: 9n, presente: false, tardanza: false, justificado: true },
      ],
      "alert.findMany": [{ student: { seccion: { nombre: "", grado: { numero: 2 } } } }],
      "user.findFirst": { nombres: "", apellidos: "", email: null },
    },
    lmsRows: [{ seccion: null, resourceEvents: [] }],
    metrics: {
      data_mode: "real",
      dataset_version: 6,
      model_version: null,
      best_model: false,
      contract_version: null,
      decision_threshold: "0.5",
      n_features: "7",
      random_forest: { f1_score: null },
      xgboost: { f1_score: 0.6134, accuracy: null },
      feature_importance: null,
    },
  });
  try {
    const result = await buildDashboardAnalytics({});

    assert.equal(result.kpis.avgGrade, null);
    assert.equal(result.kpis.avgAttendance, null);
    assert.equal(result.kpis.directorName, "");
    assert.equal(result.kpis.directorEmail, null);
    assert.equal(result.ml.avgProbability, null);
    assert.equal(result.ml.evaluated, 1);
    assert.equal(result.ml.prioritized.length, 0);
    assert.equal(result.ml.datasetVersion, null);
    assert.equal(result.ml.modelVersion, null);
    assert.equal(result.ml.nFeatures, null);
    assert.deepEqual(result.riskByGrado, []);
    assert.deepEqual(result.attendanceByGrado, []);
    assert.deepEqual(result.alertsBySalonShort, []);
    assert.deepEqual(result.lmsActivityByGrado, []);
    assert.deepEqual(result.modelComparison, [
      { modelo: "xgboost", f1: 61.3, accuracy: 0 },
    ]);
    assert.deepEqual(result.featureImportance, []);
  } finally { restore(); }
});
