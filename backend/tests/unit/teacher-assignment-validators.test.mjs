import test from "node:test";
import assert from "node:assert/strict";
import {
  assertNoActiveDuplicateAssignment,
  assertNoOtherTeacherForCourse,
  assertPolidocenciaTeacherLimits,
  assertSingleTutor,
  assertTeacherActive,
  isTutorGrade,
} from "../../src/services/teacher-assignment.validators.js";
import { MAX_POLIDOCENCIA_COURSES, MAX_POLIDOCENCIA_SECTIONS } from "../../src/config/polidocencia.js";

test("isTutorGrade incluye primero y segundo, pero excluye grados fuera del tramo", () => {
  assert.strictEqual(isTutorGrade(1), true);
  assert.strictEqual(isTutorGrade(2), true);
  assert.strictEqual(isTutorGrade(0), false);
  assert.strictEqual(isTutorGrade(3), false);
  assert.strictEqual(isTutorGrade(6), false);
});

test("assertPolidocenciaTeacherLimits omite tutorías y permite repetir curso y salón existentes", async () => {
  let queries = 0;
  const tx = { teacherCourseAssignment: { findMany: async () => { queries++; return [{ cursoId: 1n, seccionId: 2n }]; } } };
  await assertPolidocenciaTeacherLimits(9n, 3n, 4n, 2026n, 2, tx);
  assert.strictEqual(queries, 0);
  await assertPolidocenciaTeacherLimits(9n, 1n, 2n, 2026n, 3, tx);
  assert.strictEqual(queries, 1);
});

test("assertPolidocenciaTeacherLimits bloquea nuevos cursos y nuevos salones que exceden límites", async (t) => {
  await t.test("curso adicional", async () => {
    const rows = Array.from({ length: MAX_POLIDOCENCIA_COURSES }, (_, i) => ({ cursoId: BigInt(i + 1), seccionId: BigInt(i + 1) }));
    const tx = { teacherCourseAssignment: { findMany: async () => rows } };
    await assert.rejects(assertPolidocenciaTeacherLimits(1n, 10n, 1n, 2026n, 3, tx), (e) => e.statusCode === 400 && /cursos distintos/.test(e.message));
  });
  await t.test("salón adicional", async () => {
    const rows = Array.from({ length: MAX_POLIDOCENCIA_SECTIONS }, (_, i) => ({ cursoId: 1n, seccionId: BigInt(i + 1) }));
    const tx = { teacherCourseAssignment: { findMany: async () => rows } };
    await assert.rejects(assertPolidocenciaTeacherLimits(1n, 1n, 99n, 2026n, 3, tx), (e) => e.statusCode === 400 && /salones/.test(e.message));
  });
});

test("validadores de profesor, curso y tutoría distinguen éxito y conflicto", async (t) => {
  await t.test("docente activo e inactivo", async () => {
    const activeTx = { teacher: { findUnique: async () => ({ id: 1n, activo: true }) } };
    assert.deepStrictEqual(await assertTeacherActive(1n, activeTx), { id: 1n, activo: true });
    await assert.rejects(assertTeacherActive(2n, { teacher: { findUnique: async () => null } }), (e) => e.statusCode === 404);
    await assert.rejects(assertTeacherActive(2n, { teacher: { findUnique: async () => ({ activo: false }) } }), (e) => e.statusCode === 404);
  });
  await t.test("curso ocupado por otra persona", async () => {
    const query = { teacherCourseAssignment: { findFirst: async () => null } };
    await assertNoOtherTeacherForCourse(1n, 2n, 2026n, 3n, query);
    await assert.rejects(assertNoOtherTeacherForCourse(1n, 2n, 2026n, 3n, { teacherCourseAssignment: { findFirst: async () => ({ profesorId: 4n }) } }), (e) => e.statusCode === 409);
  });
  await t.test("tutor único por sección y año", async () => {
    const query = { tutorSeccion: { findUnique: async () => null } };
    await assertSingleTutor(2n, 2026n, 3n, query);
    await assertSingleTutor(2n, 2026n, 3n, { tutorSeccion: { findUnique: async () => ({ activo: false, profesorId: 4n }) } });
    await assertSingleTutor(2n, 2026n, 3n, { tutorSeccion: { findUnique: async () => ({ activo: true, profesorId: 3n }) } });
    await assert.rejects(assertSingleTutor(2n, 2026n, 3n, { tutorSeccion: { findUnique: async () => ({ activo: true, profesorId: 4n }) } }), (e) => e.statusCode === 409);
  });
});

test("assertNoActiveDuplicateAssignment devuelve fila inactiva y rechaza una activa", async () => {
  const args = [];
  const tx = { teacherCourseAssignment: { findUnique: async (query) => { args.push(query); return { activo: false, id: 8n }; } } };
  assert.deepStrictEqual(await assertNoActiveDuplicateAssignment(tx, 1n, 2n, 3n, 2026n), { activo: false, id: 8n });
  assert.deepStrictEqual(args[0].where.profesorId_cursoId_seccionId_anioLectivoId, {
    profesorId: 1n, cursoId: 2n, seccionId: 3n, anioLectivoId: 2026n,
  });
  await assert.rejects(assertNoActiveDuplicateAssignment({ teacherCourseAssignment: { findUnique: async () => ({ activo: true }) } }, 1n, 2n, 3n, 2026n), (e) => e.statusCode === 409);
});
