import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const {
  estudiantePerfil,
  estudianteDashboard,
  estudianteNotas,
  estudianteAsistencia,
  estudianteLms,
  estudiantePrediccion,
  estudianteAlertas,
  estudianteMensajes,
} = await import("../../src/controllers/estudiante.controller.js");

const makeReq = (overrides = {}) => ({ query: {}, params: {}, body: {}, user: undefined, ...overrides });
const makeRes = () => {
  const res = {
    status: (code) => ({ json: (body) => { res.body = body; res.statusCode = code; return res; } }),
    statusCode: 200,
    body: null,
  };
  return res;
};
const nextFn = (e) => { throw e; };

test("estudiante: perfil devuelve 403 cuando no hay scope de estudiante", async () => {
  const orig = mockPrisma(prisma.student, "findFirst", async () => null);
  const res = makeRes();
  let error;
  try {
    await estudiantePerfil(
      { query: {}, user: { sub: "99", role: "estudiante" } },
      res, nextFn,
    );
  } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 403);
  prisma.student.findFirst = orig;
});

test("rutas de estudiante propagan el rechazo cuando el usuario no tiene perfil vinculado", async () => {
  const original = prisma.student.findFirst;
  prisma.student.findFirst = test.mock.fn(async () => null);
  try {
    for (const handler of [
      estudiantePerfil,
      estudianteDashboard,
      estudianteNotas,
      estudianteAsistencia,
      estudianteLms,
      estudiantePrediccion,
      estudianteAlertas,
      estudianteMensajes,
    ]) {
      const req = { query: {}, params: {}, body: {}, user: { sub: "99", role: "estudiante" } };
      await assert.rejects(handler(req, makeRes(), nextFn), (error) => error.statusCode === 403);
    }
  } finally {
    prisma.student.findFirst = original;
  }
});
