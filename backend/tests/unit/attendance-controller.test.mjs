import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { listAttendance } = await import("../../src/controllers/attendance.controller.js");

const makeReq = (overrides = {}) => ({ query: {}, params: {}, user: undefined, ...overrides });
const makeRes = () => {
  const res = {
    status: (code) => ({ json: (body) => { res.body = body; res.statusCode = code; return res; } }),
    statusCode: 200,
    body: null,
  };
  return res;
};
const nextFn = (e) => { throw e; };

test("attendance: listAttendance admin devuelve items", async () => {
  const orig1 = mockPrisma(prisma.attendance, "findMany", async () => ([
    { id: 1n, studentId: 1n, fecha: "2026-01-01", estado: "presente" },
  ]));
  const orig2 = mockPrisma(prisma.attendance, "count", async () => 1);
  const res = makeRes();
  await listAttendance(
    { query: {}, user: { role: "admin", sub: "1" } },
    res, nextFn,
  );
  assert.strictEqual(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.data.items));
  assert.strictEqual(res.body.data.total, 1);
  prisma.attendance.findMany = orig1;
  prisma.attendance.count = orig2;
});

test("attendance: listAttendance con filtros de fecha", async () => {
  const orig1 = mockPrisma(prisma.attendance, "findMany", async () => ([]));
  const orig2 = mockPrisma(prisma.attendance, "count", async () => 0);
  const res = makeRes();
  await listAttendance(
    { query: { from: "2026-01-01", to: "2026-02-01" }, user: { role: "admin", sub: "1" } },
    res, nextFn,
  );
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.data.items, []);
  prisma.attendance.findMany = orig1;
  prisma.attendance.count = orig2;
});

test("attendance: listAttendance docente con scope", async () => {
  const orig1 = mockPrisma(prisma.teacher, "findFirst", async () => ({ id: 5n }));
  const orig2 = mockPrisma(prisma.teacherCourseAssignment, "findMany", async () => [
    { seccionId: 10n },
  ]);
  const orig3 = mockPrisma(prisma.attendance, "findMany", async () => ([]));
  const orig4 = mockPrisma(prisma.attendance, "count", async () => 0);
  const res = makeRes();
  await listAttendance(
    { query: {}, user: { role: "docente", sub: "7" } },
    res, nextFn,
  );
  assert.strictEqual(res.statusCode, 200);
  prisma.teacher.findFirst = orig1;
  prisma.teacherCourseAssignment.findMany = orig2;
  prisma.attendance.findMany = orig3;
  prisma.attendance.count = orig4;
});
