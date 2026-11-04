import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { assertTeacherCourseAccess, assertStudentInCourseSection } = await import("../../src/utils/course-authorization.js");

test("courseAuth: admin puede acceder a cualquier curso", async () => {
  await assert.doesNotReject(assertTeacherCourseAccess({ sub: "1", role: "admin" }, "1"));
});

test("courseAuth: no docente lanza 403", async () => {
  let error;
  try { await assertTeacherCourseAccess({ sub: "7", role: "estudiante" }, "1"); } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 403);
});

test("courseAuth: docente sin teacher lanza 403", async () => {
  const orig = mockPrisma(prisma.teacher, "findFirst", async () => null);
  let error;
  try { await assertTeacherCourseAccess({ sub: "7", role: "docente" }, "1"); } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 403);
  prisma.teacher.findFirst = orig;
});

test("courseAuth: estudiante en misma sección pasa", async () => {
  const orig1 = mockPrisma(prisma.course, "findFirst", async () => ({ seccionId: "sec-1" }));
  const orig2 = mockPrisma(prisma.student, "findFirst", async () => ({ seccionId: "sec-1" }));
  const orig3 = mockPrisma(prisma.enrollment, "findFirst", async () => ({ id: 1n }));
  await assert.doesNotReject(assertStudentInCourseSection("1", "1"));
  prisma.course.findFirst = orig1;
  prisma.student.findFirst = orig2;
  prisma.enrollment.findFirst = orig3;
});

test("courseAuth: estudiante sin inscripción lanza 403", async () => {
  const orig1 = mockPrisma(prisma.course, "findFirst", async () => ({ seccionId: "sec-1" }));
  const orig2 = mockPrisma(prisma.student, "findFirst", async () => ({ seccionId: "sec-1" }));
  const orig3 = mockPrisma(prisma.enrollment, "findFirst", async () => null);
  let error;
  try { await assertStudentInCourseSection("1", "1"); } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 403);
  prisma.course.findFirst = orig1;
  prisma.student.findFirst = orig2;
  prisma.enrollment.findFirst = orig3;
});

test("courseAuth: estudiante en sección diferente lanza 403", async () => {
  const orig1 = mockPrisma(prisma.course, "findFirst", async () => ({ seccionId: "sec-1" }));
  const orig2 = mockPrisma(prisma.student, "findFirst", async () => ({ seccionId: "sec-2" }));
  const orig3 = mockPrisma(prisma.enrollment, "findFirst", async () => null);
  let error;
  try { await assertStudentInCourseSection("1", "1"); } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 403);
  prisma.course.findFirst = orig1;
  prisma.student.findFirst = orig2;
  prisma.enrollment.findFirst = orig3;
});
