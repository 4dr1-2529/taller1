import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import {
  loadStudentProfile, buildEstudianteDashboard, buildEstudianteNotas,
  buildEstudianteAsistencia, buildEstudianteLms, buildEstudiantePrediccion,
  buildEstudianteAlertas, buildEstudianteMensajes,
} from "../../src/services/estudiante.service.js";

const sid = 12n;
const now = new Date("2026-06-15T12:00:00Z");
const baseStudent = {
  id: sid, codigo: "S-12", nombres: "Ana", apellidos: "Pérez", email: "ana@example.test", telefono: "999123456",
  seccionId: 8n, seccion: { nombre: "B", grado: { numero: 2, nombre: "2°", nivel: { nombre: "Primaria" } } },
};
const records = [
  ["student", "findUnique", baseStudent], ["student", "findFirst", { id: sid, seccionId: 8n }],
  ["periodoAcademico", "findFirst", { id: 4n, nombre: "II Bimestre", numero: 2, fechaInicio: new Date("2026-05-01"), fechaFin: new Date("2026-06-30") }],
  ["anioLectivo", "findFirst", { id: 2026n, anio: 2026 }],
  ["lmsEvent", "findMany", [{ tipo: "login", resourceId: 3n, durationSeconds: 125, createdAt: now }]],
  ["activityProgress", "count", 2],
  ["grade", "groupBy", [{ cursoOfertaId: 2n, _avg: { nota: 14 } }, { cursoOfertaId: 3n, _avg: { nota: 9 } }]],
  ["grade", "findFirst", { nota: 18, createdAt: now, periodo: { numero: 2 }, cursoOferta: { codigo: "MAT", cursoCatalogo: { nombre: "Matemática" } } }],
  ["grade", "findMany", [
    { cursoOfertaId: 2n, nota: 16, periodo: { numero: 1 } },
    { cursoOfertaId: 2n, nota: 10, periodo: { numero: 2 } },
    { cursoOfertaId: 2n, nota: 12, periodo: { numero: 3 } },
    { cursoOfertaId: 3n, nota: 8, periodo: { numero: 1 } },
  ]],
  ["course", "findMany", [
    { id: 2n, codigo: "MAT", cursoCatalogo: { nombre: "Matemática" }, profesor: { nombres: "Luis", apellidos: "Sol" } },
    { id: 3n, codigo: "COM", cursoCatalogo: { nombre: "Comunicación" }, profesor: null },
    { id: 4n, codigo: "CIE", cursoCatalogo: { nombre: "Ciencia" }, profesor: null },
  ]],
  ["attendance", "findMany", [
    { id: 1n, fecha: now, presente: true, tardanza: false, justificado: false, observacion: "ok" },
    { id: 2n, fecha: new Date("2026-06-14"), presente: false, tardanza: true, justificado: false, observacion: null },
    { id: 3n, fecha: new Date("2026-06-13"), presente: false, tardanza: false, justificado: false, observacion: null },
    { id: 4n, fecha: new Date("2026-06-12"), presente: false, tardanza: false, justificado: true, observacion: "cita" },
  ]],
  ["attendance", "findFirst", { fecha: now, presente: false, tardanza: true, justificado: false }],
  ["tutorSeccion", "findFirst", { profesor: { nombres: "Luis", apellidos: "Sol" } }],
  ["prediction", "findFirst", {
    id: 20n, score: 80, probabilidad: 0.8, probabilidadAbandono: 0.8, nivelRiesgo: "alto", modelName: null,
    createdAt: now, inputData: { modelVersion: "v6", datasetVersion: "2026.1", dataMode: "real" },
    modelo: { nombre: "RF", version: "6" }, factores: [{ factorKey: "attendance", etiqueta: "Asistencia", contribucion: 8 }],
    recomendaciones: [{ detalle: "Contactar" }],
  }],
  ["alert", "findMany", [
    { id: 31n, nivelRiesgo: "medio", titulo: "Seguimiento", recomendacion: "Llamar", estado: "en_seguimiento", score: 55, probabilidad: 0.55, createdAt: now },
    { id: 32n, nivelRiesgo: "nueva-custom", titulo: "Extra", recomendacion: null, estado: "custom", score: null, probabilidad: null, createdAt: now },
  ]],
  ["aiRecommendation", "findFirst", { detalle: "Recomendación personalizada" }],
  ["student", "findFirst", { id: sid, seccionId: 8n }],
  ["enrollment", "findMany", [{ cursoOfertaId: 2n }]],
  ["mensajeSala", "findMany", [
    { id: 1n, roomId: "global:institucional" }, { id: 2n, roomId: "curso:2" },
    { id: 3n, roomId: "direct:12:99" }, { id: 4n, roomId: "direct:99:12" },
    { id: 5n, roomId: "direct:12:12:extra" }, { id: 6n, roomId: "curso:77" },
  ]],
  ["chatMessage", "findMany", [{ id: 7n, remitente: { nombres: "Luis", apellidos: "Sol", email: "luis@example.test" }, sala: { cursoOferta: { codigo: "MAT", cursoCatalogo: { nombre: "Matemática" } } }, contenido: "Hola", createdAt: now, lecturas: [] }]],
];

function setup(overrides = {}) {
  const originals = new Map();
  for (const [model, method, value] of records) {
    const key = `${model}.${method}`;
    if (!originals.has(key)) originals.set(key, prisma[model][method]);
    prisma[model][method] = async () => Object.hasOwn(overrides, key) ? overrides[key] : value;
  }
  const restore = () => {
    for (const [key, fn] of originals) {
      const [model, method] = key.split(".");
      prisma[model][method] = fn;
    }
  };
  return restore;
}

test("perfil y dashboard del estudiante mapean métricas, actividad, nota, asistencia y alertas", async () => {
  const restore = setup();
  try {
    const profile = await loadStudentProfile(sid);
    assert.deepStrictEqual(profile, {
      id: "12", codigo: "S-12", nombres: "Ana", apellidos: "Pérez", email: "ana@example.test", telefono: "999123456",
      grado: 2, gradoLabel: "2°", seccion: "B", salon: "2°B", periodoAcademico: "II Bimestre",
      promedioGeneral: 11.5, asistenciaGeneral: 66.66666666666667,
    });
    const dashboard = await buildEstudianteDashboard(sid);
    assert.strictEqual(dashboard.kpis.nivelRiesgo, "Alto");
    assert.strictEqual(dashboard.kpis.alertasActivas, 2);
    assert.strictEqual(dashboard.resumen.ultimaNota.curso, "Matemática");
    assert.strictEqual(dashboard.resumen.ultimaAsistencia.estado, "Tardanza");
    assert.strictEqual(dashboard.resumen.ultimaActividadLms.minutos, 2.1);
    assert.strictEqual(dashboard.resumen.ultimaPrediccion.nivel, "Alto");
    assert.strictEqual(dashboard.resumen.recomendacion, "Recomendación personalizada");
    assert.deepStrictEqual(dashboard.alertasPreview.map(a => a.estado), ["En seguimiento", "custom"]);
  } finally { restore(); }
});

test("notas agrupa periodos, calcula promedios y cuenta estados con cursos sin notas", async () => {
  const restore = setup();
  try {
    const result = await buildEstudianteNotas(sid);
    assert.deepStrictEqual(result.filas.map(f => [f.curso, f.promedioFinal, f.estado]), [
      ["Matemática", 12.7, "En riesgo"], ["Comunicación", 8, "Desaprobado"], ["Ciencia", null, "—"],
    ]);
    assert.deepStrictEqual(result.resumen, {
      promedioGeneral: 11.5, cursosAprobados: 0, cursosEnRiesgo: 1, cursosDesaprobados: 1, totalCursos: 3,
    });
  } finally { restore(); }
});

test("notas incluye aprobados, redondea promedios y mantiene el estado si faltan bimestres", async () => {
  const restore = setup({
    "student.findUnique": { ...baseStudent, seccionId: 8n },
    "course.findMany": [
      { id: 10n, codigo: "MAT", cursoCatalogo: { nombre: "Matemática" }, profesor: null },
      { id: 11n, codigo: "COM", cursoCatalogo: { nombre: "Comunicación" }, profesor: { nombres: "Luz", apellidos: "Sol" } },
      { id: 12n, codigo: "CIE", cursoCatalogo: { nombre: "Ciencia" }, profesor: null },
    ],
    "grade.findMany": [
      { cursoOfertaId: 10n, nota: 14, periodo: { numero: 1 } },
      { cursoOfertaId: 10n, nota: 15, periodo: { numero: 4 } },
      { cursoOfertaId: 11n, nota: 11, periodo: { numero: 2 } },
      { cursoOfertaId: 12n, nota: 10.5, periodo: { numero: 3 } },
    ],
  });
  try {
    const result = await buildEstudianteNotas(sid);
    assert.deepEqual(result.filas.map(({ promedioFinal, estado, profesor }) => [promedioFinal, estado, profesor]), [
      [14.5, "Aprobado", null], [11, "En riesgo", "Luz Sol"], [10.5, "Desaprobado", null],
    ]);
    assert.deepEqual(result.resumen, {
      promedioGeneral: 11.5,
      cursosAprobados: 1,
      cursosEnRiesgo: 1,
      cursosDesaprobados: 1,
      totalCursos: 3,
    });
  } finally { restore(); }
});

test("asistencia filtra estado, calcula porcentaje computable y devuelve tutor", async () => {
  const restore = setup();
  try {
    const result = await buildEstudianteAsistencia(sid, { mes: "2026-06", estado: "presente" });
    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].estado, "Asistió");
    assert.strictEqual(result.items[0].profesor, "Luis Sol");
    assert.deepStrictEqual(result.resumen, { asistencias: 1, tardanzas: 0, faltas: 0, justificadas: 0, porcentaje: 100, total: 1 });
    const onlyExcused = await buildEstudianteAsistencia(sid, { estado: "justificada" });
    assert.strictEqual(onlyExcused.resumen.porcentaje, null);
    assert.strictEqual(onlyExcused.resumen.justificadas, 1);
  } finally { restore(); }
});

test("asistencia reconoce tardanza, falta, alias asistio y filtro de estado parcial", async () => {
  const restore = setup({
    "attendance.findMany": [
      { id: 10n, fecha: now, presente: true, tardanza: false, justificado: false, observacion: null },
      { id: 11n, fecha: now, presente: true, tardanza: true, justificado: false, observacion: null },
      { id: 12n, fecha: now, presente: false, tardanza: false, justificado: false, observacion: null },
    ],
  });
  try {
    const tardy = await buildEstudianteAsistencia(sid, { estado: "tardanza" });
    assert.deepEqual(tardy.items.map((item) => item.estado), ["Tardanza"]);
    assert.equal(tardy.resumen.porcentaje, 100);

    const absent = await buildEstudianteAsistencia(sid, { estado: "falta" });
    assert.deepEqual(absent.items.map((item) => item.estado), ["Falta"]);
    assert.equal(absent.resumen.faltas, 1);
    assert.equal(absent.resumen.porcentaje, 0);

    const alias = await buildEstudianteAsistencia(sid, { estado: "asistio" });
    assert.deepEqual(alias.items.map((item) => item.estado), ["Asistió"]);
    const partial = await buildEstudianteAsistencia(sid, { estado: "tard" });
    assert.deepEqual(partial.items.map((item) => item.estado), ["Tardanza"]);
  } finally { restore(); }
});

test("LMS y predicción preservan vacíos, trazabilidad, factores y recomendación", async () => {
  const restore = setup();
  try {
    const lms = await buildEstudianteLms(sid);
    assert.strictEqual(lms.indicators.actividades_realizadas, 2);
    assert.strictEqual(lms.profile.id, "12");
    const prediction = await buildEstudiantePrediccion(sid);
    assert.strictEqual(prediction.prediction.probabilidadAbandono, 0.8);
    assert.strictEqual(prediction.prediction.modeloVersion, "6");
    assert.strictEqual(prediction.prediction.dataMode, "real");
    assert.deepStrictEqual(prediction.prediction.factores, [{ key: "attendance", label: "Asistencia", contribution: 8 }]);
    assert.strictEqual(prediction.prediction.recomendacion, "Contactar");
    const empty = await buildEstudiantePrediccion(sid);
    assert.strictEqual(empty.prediction.nivelRiesgo, "Alto");
  } finally { restore(); }
});

test("alertas y mensajes solo incluyen salas accesibles y traducen estados", async () => {
  const restore = setup({ "prediction.findFirst": null });
  try {
    const alerts = await buildEstudianteAlertas(sid);
    assert.strictEqual(alerts.total, 2);
    assert.strictEqual(alerts.items[0].nivelRiesgo, "Medio");
    assert.strictEqual(alerts.items[0].estado, "En seguimiento");
    assert.strictEqual(alerts.items[1].score, null);
    const messages = await buildEstudianteMensajes(sid);
    assert.strictEqual(messages.total, 1);
    assert.strictEqual(messages.items[0].remitente, "Luis Sol");
    assert.strictEqual(messages.items[0].curso, "Matemática");
    assert.strictEqual(messages.items[0].leido, false);
  } finally { restore(); }
});

test("el dashboard y las notas toleran un estudiante sin perfil ni registros", async () => {
  const restore = setup({
    "student.findUnique": null,
    "student.findFirst": null,
    "periodoAcademico.findFirst": null,
    "grade.findFirst": null,
    "grade.findMany": [],
    "attendance.findFirst": null,
    "prediction.findFirst": null,
    "alert.findMany": [],
    "lmsEvent.findMany": [],
    "aiRecommendation.findFirst": null,
    "course.findMany": [],
  });
  try {
    assert.equal(await loadStudentProfile(sid), null);
    const dashboard = await buildEstudianteDashboard(sid);
    assert.equal(dashboard.profile, null);
    assert.equal(dashboard.kpis.grado, "—");
    assert.equal(dashboard.kpis.salon, "—");
    assert.equal(dashboard.kpis.nivelRiesgo, "Sin datos");
    assert.equal(dashboard.resumen.ultimaNota, null);
    assert.equal(dashboard.resumen.ultimaAsistencia, null);
    assert.equal(dashboard.resumen.ultimaActividadLms, null);
    assert.equal(dashboard.resumen.ultimaPrediccion, null);
    assert.equal(dashboard.resumen.recomendacion, null);
    const notas = await buildEstudianteNotas(sid);
    assert.deepEqual(notas.filas, []);
    assert.equal(notas.resumen.totalCursos, 0);
  } finally { restore(); }
});

test("asistencia aplica rangos y bimestre, contempla alumno sin sección y estados desconocidos", async () => {
  const restore = setup({
    "student.findUnique": null,
    "student.findFirst": null,
    "periodoAcademico.findFirst": {
      id: 6n, nombre: "IV Bimestre", numero: 4,
      fechaInicio: new Date("2026-10-01"), fechaFin: new Date("2026-12-20"),
    },
    "attendance.findMany": [],
  });
  try {
    const result = await buildEstudianteAsistencia(sid, {
      desde: "2026-02-01", hasta: "2026-03-01", mes: "2026-02", bimestre: "4", estado: "sin coincidencia",
    });
    assert.equal(result.profile, null);
    assert.deepEqual(result.items, []);
    assert.deepEqual(result.resumen, {
      asistencias: 0, tardanzas: 0, faltas: 0, justificadas: 0, porcentaje: null, total: 0,
    });
  } finally { restore(); }
});

test("predicción sin registro y mensajes sin salas accesibles devuelven resultados vacíos", async () => {
  const restore = setup({
    "student.findUnique": null,
    "prediction.findFirst": null,
    "student.findFirst": null,
    "mensajeSala.findMany": [],
  });
  try {
    const prediction = await buildEstudiantePrediccion(sid);
    assert.equal(prediction.profile, null);
    assert.equal(prediction.prediction, null);
    assert.deepEqual(await buildEstudianteMensajes(sid), { items: [], total: 0 });
  } finally { restore(); }
});

test("predicción usa sus valores de respaldo cuando no hay modelo ni recomendación", async () => {
  const restore = setup({
    "student.findUnique": null,
    "prediction.findFirst": {
      id: 44n, score: 42, probabilidad: 0.42, probabilidadAbandono: 0.42, nivelRiesgo: "personalizado",
      modelName: null, createdAt: now, inputData: {}, modelo: null, factores: [], recomendaciones: [],
    },
  });
  try {
    const { prediction } = await buildEstudiantePrediccion(sid);
    assert.equal(prediction.nivelRiesgo, "personalizado");
    assert.equal(prediction.modelo, "Modelo registrado");
    assert.equal(prediction.modeloVersion, null);
    assert.equal(prediction.dataMode, null);
    assert.equal(prediction.datasetVersion, null);
    assert.deepEqual(prediction.factores, []);
    assert.equal(prediction.recomendacion, "Mantenga seguimiento de sus indicadores académicos y participación LMS.");
  } finally { restore(); }
});

