import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { getTeacherIdFromUser, getTeacherSectionIds, studentWhereForSectionIds, resolveTeacherSectionIds, resolveTeacherCourseWhere } = await import("../../src/utils/teacher-scope.js");

test("studentWhereForSectionIds pura sin secciones devuelve none", () => {
  assert.deepStrictEqual(studentWhereForSectionIds([]), { id: { in: [] } });
});

test("studentWhereForSectionIds con secciones filtra por seccionId", () => {
  const base = { activo: true };
  const result = studentWhereForSectionIds([10n, 11n], base);
  assert.deepStrictEqual(result, { activo: true, seccionId: { in: [10n, 11n] } });
});

test("studentWhereForSectionIds sin base usa activo true", () => {
  const result = studentWhereForSectionIds([5n]);
  assert.deepStrictEqual(result, { activo: true, seccionId: { in: [5n] } });
});

test("getTeacherIdFromUser devuelve null cuando no hay teacher", async () => {
  const orig = mockPrisma(prisma.teacher, "findFirst", async () => null);
  const result = await getTeacherIdFromUser("99");
  assert.strictEqual(result, null);
  prisma.teacher.findFirst = orig;
});

test("getTeacherIdFromUser devuelve el id del teacher", async () => {
  const orig = mockPrisma(prisma.teacher, "findFirst", async () => ({ id: 42n }));
  const result = await getTeacherIdFromUser("7");
  assert.strictEqual(result, 42n);
  prisma.teacher.findFirst = orig;
});

test("getTeacherSectionIds devuelve ids únicos de secciones", async () => {
  const orig = mockPrisma(prisma.teacherCourseAssignment, "findMany", async () => [
    { seccionId: 10n }, { seccionId: 10n }, { seccionId: 11n },
  ]);
  const result = await getTeacherSectionIds(5n);
  assert.deepStrictEqual(result, [10n, 11n]);
  prisma.teacherCourseAssignment.findMany = orig;
});

test("getTeacherSectionIds devuelve array vacío cuando no hay asignaciones", async () => {
  const orig = mockPrisma(prisma.teacherCourseAssignment, "findMany", async () => []);
  const result = await getTeacherSectionIds(5n);
  assert.deepStrictEqual(result, []);
  prisma.teacherCourseAssignment.findMany = orig;
});

test("resolveTeacherSectionIds devuelve [] para rol no docente", async () => {
  const result = await resolveTeacherSectionIds({ sub: "7", role: "admin" });
  assert.deepStrictEqual(result, []);
});

test("resolveTeacherSectionIds devuelve [] para docente sin teacher", async () => {
  const orig = mockPrisma(prisma.teacher, "findFirst", async () => null);
  const result = await resolveTeacherSectionIds({ sub: "7", role: "docente" });
  assert.deepStrictEqual(result, []);
  prisma.teacher.findFirst = orig;
});

test("resolveTeacherSectionIds devuelve secciones del docente", async () => {
  const origFindTeacher = mockPrisma(prisma.teacher, "findFirst", async () => ({ id: 5n }));
  const origFindAssignments = mockPrisma(prisma.teacherCourseAssignment, "findMany", async () => [
    { seccionId: 10n }, { seccionId: 11n },
  ]);
  const result = await resolveTeacherSectionIds({ sub: "7", role: "docente" });
  assert.deepStrictEqual(result, [10n, 11n]);
  prisma.teacher.findFirst = origFindTeacher;
  prisma.teacherCourseAssignment.findMany = origFindAssignments;
});

test("resolveTeacherCourseWhere devuelve [] para rol no docente", async () => {
  const result = await resolveTeacherCourseWhere({ sub: "7", role: "estudiante" });
  assert.deepStrictEqual(result, { id: { in: [] } });
});

test("resolveTeacherCourseWhere filtra por cursoOfertaId no nulo", async () => {
  const origFindTeacher = mockPrisma(prisma.teacher, "findFirst", async () => ({ id: 5n }));
  const origFindAssignments = mockPrisma(prisma.teacherCourseAssignment, "findMany", async () => [
    { cursoOfertaId: 100n }, { cursoOfertaId: null }, { cursoOfertaId: 200n },
  ]);
  const result = await resolveTeacherCourseWhere({ sub: "7", role: "docente" });
  assert.deepStrictEqual(result, { activo: true, id: { in: [100n, 200n] } });
  prisma.teacher.findFirst = origFindTeacher;
  prisma.teacherCourseAssignment.findMany = origFindAssignments;
});
