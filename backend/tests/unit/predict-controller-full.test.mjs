import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { predict } = await import("../../src/controllers/predict.controller.js");

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

test("predict: rechaza body inválido", async () => {
  const res = makeRes();
  let error;
  try {
    await predict({ body: {}, user: { sub: "1", role: "estudiante" } }, res, nextFn);
  } catch (e) { error = e; }
  assert.ok(error);
});

test("predict: rechaza body vacío con error de validación", async () => {
  const res = makeRes();
  let error;
  try {
    await predict({ body: {}, user: { sub: "1", role: "docente" } }, res, nextFn);
  } catch (e) { error = e; }
  assert.ok(error);
});

test("predict: valida el identificador y devuelve 404 cuando no existe el estudiante", async () => {
  const invalidRes = makeRes();
  let validationError;
  try {
    await predict(makeReq({ body: { studentId: "0" }, user: { sub: "1", role: "admin" } }), invalidRes, nextFn);
  } catch (error) { validationError = error; }
  assert.ok(validationError);

  const original = mockPrisma(prisma.student, "findUnique", async () => null);
  try {
    const res = makeRes();
    let error;
    try {
      await predict(makeReq({ body: { studentId: "42" }, user: { sub: "1", role: "admin" } }), res, (value) => { error = value; });
    } catch (value) { error = value; }
    assert.equal(error?.statusCode, 404);
  } finally {
    prisma.student.findUnique = original;
  }
});
