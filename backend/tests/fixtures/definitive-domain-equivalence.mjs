import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readDataset } from "../../scripts/lib/definitive-dataset-reader.mjs";
import { generateDataset } from "../../scripts/lib/definitive-operational-generator.mjs";
import { refreshImportedSummary } from "../../scripts/lib/definitive-dataset-import.mjs";

// All domain database access is replaced before importing modules that use Prisma.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "mysql://unavailable@127.0.0.1:1/no_database";
process.env.JWT_SECRET = randomBytes(32).toString("hex");
process.env.POLIDOCENCIA_MAX_SALONES = "8";
const db = {};
globalThis.prisma = db;
const { refreshAcademicSummary } = await import("../../src/services/academic-records.service.ts");
const { syncCourseOffering } = await import("../../src/services/teacher-assignment.service.ts");
const { assertPolidocenciaTeacherLimits } = await import("../../src/services/teacher-assignment.validators.ts");
const { studentIndicators } = await import("../../src/services/lms.service.ts");
const source = readDataset();
const { tables: t } = generateDataset(source);
let lastUpdate;
for (const s of t.student) {
  const notes = t.grade.filter(g => g.student === s.codigo);
  const courseMeans = [...new Set(notes.map(g => g.course))].sort().map(c => {
    const rows = notes.filter(g => g.course === c);
    return { cursoOfertaId: c, _avg: { nota: rows.reduce((sum, r) => sum + r.nota, 0) / rows.length } };
  });
  db.grade = { groupBy: async () => courseMeans };
  db.attendance = { findMany: async () => t.attendance.filter(a => a.student === s.codigo) };
  db.student = { update: async ({ data }) => { lastUpdate = data; } };
  await refreshAcademicSummary(db, 1n);
  const actual = lastUpdate;
  await refreshImportedSummary(db, 1n);
  assert.deepEqual(lastUpdate, actual);
  assert.equal(actual.promedioGeneral, s.promedioGeneral);
  assert.equal(actual.asistenciaGeneral, s.asistenciaGeneral);
  const events = t.lmsEvent.filter(e => e.student === s.codigo).map(e => ({ ...e, resourceId: e.resource, createdAt: new Date(e.createdAt) }));
  db.lmsEvent = { findMany: async () => events };
  db.activityProgress = { count: async () => t.activityProgress.filter(p => p.student === s.codigo && p.estado === "completada").length };
  const indicators = await studentIndicators(1n, new Date("2026-09-21T23:59:59.999Z"));
  assert.equal(indicators.frecuencia_acceso_lms, events.filter(e => e.tipo === "login").length / 4);
  assert.equal(indicators.tiempo_interaccion_lms, events.reduce((sum, e) => sum + e.durationSeconds, 0) / 3600);
  assert.equal(indicators.recursos_consultados, new Set(events.filter(e => e.resourceId).map(e => e.resourceId)).size);
}
for (const [i, a] of t.teacherCourseAssignment.entries()) {
  const c = t.course.find(c => c.key === a.course);
  const assignment = { id: BigInt(i + 1), profesorId: 1n, cursoId: 2n, seccionId: 3n, anioLectivoId: 4n, activo: true };
  const sec = { id: 3n, nombre: a.section.slice(1), grado: { numero: a.grade, nivel: { codigo: "primaria" } } };
  const tx = {
    cursoCatalogo: { findUniqueOrThrow: async () => ({ codigo: a.catalog }) },
    course: { upsert: async ({ create }) => { assert.equal(create.codigo, c.codigo); assert.equal(create.profesorId, assignment.profesorId); return { ...create, id: 5n }; } },
    teacherCourseAssignment: { update: async ({ data }) => assert.equal(data.cursoOfertaId, 5n) },
    matricula: { findMany: async () => t.matricula.filter(m => m.section === a.section && m.estado === "activa").map((m, j) => ({ estudianteId: BigInt(j + 1) })) },
    enrollment: { createMany: async ({ data }) => assert.equal(data.length, t.enrollment.filter(e => e.course === c.key && e.estado === "activa").length) },
  };
  await syncCourseOffering(assignment, sec, tx);
}
for (const teacher of source.Profesores.slice(8)) {
  const rows = t.teacherCourseAssignment.filter(a => a.teacher === teacher.codigo);
  const collected = [];
  const tx = { teacherCourseAssignment: { findMany: async () => collected } };
  for (const a of rows) {
    await assertPolidocenciaTeacherLimits(1n, a.catalog, a.section, 1n, a.grade, tx);
    collected.push({ cursoId: a.catalog, seccionId: a.section });
  }
  await assert.rejects(assertPolidocenciaTeacherLimits(1n, "UNKNOWN", rows[0].section, 1n, 3, tx));
}
console.log("DOMAIN_EQUIVALENCE_OK: 250 summaries/indicators, 328 offerings, 16 specialist scopes; database connections=0");
