import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { resolveStudentScope, resolveCourseScope, assertStudentInScope } = await import("../../src/utils/student-scope.js");

const admin = { sub: "1", role: "admin" };
const docente = { sub: "2", role: "docente" };
const estudiante = { sub: "3", role: "estudiante" };

test("studentScope: admin devuelve activo true", async () => {
  const scope = await resolveStudentScope(admin);
  assert.deepStrictEqual(scope, { activo: true });
});

test("studentScope: docente sin teacher devuelve none", async () => {
  const orig = mockPrisma(prisma.teacher, "findFirst", async () => null);
  const scope = await resolveStudentScope(docente);
  assert.deepStrictEqual(scope, { id: { in: [] } });
  prisma.teacher.findFirst = orig;
});

test("studentScope: docente con teacher y secciones", async () => {
  const orig1 = mockPrisma(prisma.teacher, "findFirst", async () => ({ id: 5n }));
  const orig2 = mockPrisma(prisma.teacherCourseAssignment, "findMany", async () => [
    { seccionId: 10n }, { seccionId: 11n },
  ]);
  const scope = await resolveStudentScope(docente);
  assert.deepStrictEqual(scope, {
    activo: true,
    matriculas: { some: { estado: "activa", anioLectivo: { anio: 2026 } } },
    inscripciones: { some: { estado: "activa", course: { profesorId: 5n, activo: true, anioLectivo: { anio: 2026 } } } },
    seccionId: { in: [10n, 11n] },
  });
  prisma.teacher.findFirst = orig1;
  prisma.teacherCourseAssignment.findMany = orig2;
});

test("studentScope: estudiante sin registro devuelve none", async () => {
  const orig = mockPrisma(prisma.student, "findFirst", async () => null);
  const scope = await resolveStudentScope(estudiante);
  assert.deepStrictEqual(scope, { id: { in: [] } });
  prisma.student.findFirst = orig;
});

test("studentScope: estudiante encontrado devuelve su id", async () => {
  const orig = mockPrisma(prisma.student, "findFirst", async () => ({ id: 42n }));
  const scope = await resolveStudentScope(estudiante);
  assert.deepStrictEqual(scope, { id: 42n });
  prisma.student.findFirst = orig;
});

test("courseScope: admin devuelve activo true", async () => {
  assert.deepStrictEqual(await resolveCourseScope(admin), { activo: true });
});

test("courseScope: docente sin teacher devuelve none", async () => {
  const orig = mockPrisma(prisma.teacher, "findFirst", async () => null);
  assert.deepStrictEqual(await resolveCourseScope(docente), { id: { in: [] } });
  prisma.teacher.findFirst = orig;
});

test("courseScope: docente con teacher filtra por profesor", async () => {
  const orig = mockPrisma(prisma.teacher, "findFirst", async () => ({ id: 5n }));
  assert.deepStrictEqual(await resolveCourseScope(docente), { activo: true, profesorId: 5n });
  prisma.teacher.findFirst = orig;
});

test("courseScope: estudiante sin seccion devuelve none", async () => {
  const orig = mockPrisma(prisma.student, "findFirst", async () => ({ id: 42n, seccionId: null }));
  assert.deepStrictEqual(await resolveCourseScope(estudiante), { id: { in: [] } });
  prisma.student.findFirst = orig;
});

test("courseScope: estudiante con seccion filtra", async () => {
  const orig = mockPrisma(prisma.student, "findFirst", async () => ({ id: 42n, seccionId: 9n }));
  assert.deepStrictEqual(await resolveCourseScope(estudiante), { activo: true, seccionId: 9n });
  prisma.student.findFirst = orig;
});

test("assertStudentInScope lanza 403 cuando no está en alcance", async () => {
  const orig = mockPrisma(prisma.student, "findFirst", async () => null);
  let error;
  try { await assertStudentInScope(estudiante, "99"); } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 403);
  prisma.student.findFirst = orig;
});

test("assertStudentInScope pasa cuando está en alcance", async () => {
  const orig = mockPrisma(prisma.student, "findFirst", async () => ({ id: 42n }));
  await assert.doesNotReject(assertStudentInScope(estudiante, "42"));
  prisma.student.findFirst = orig;
});
