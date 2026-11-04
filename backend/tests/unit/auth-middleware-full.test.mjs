import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { authenticate, authorize } = await import("../../src/middleware/auth.js");

const makeReq = (overrides = {}) => ({
  headers: {},
  user: undefined,
  ...overrides,
});

const makeRes = () => ({
  status: () => ({ json: () => ({}) }),
});

test("authMiddleware: authenticate lanza 401 sin header Bearer", async () => {
  const req = makeReq({ headers: {} });
  let error;
  await authenticate(req, makeRes(), (e) => { error = e; });
  assert.ok(error);
  assert.strictEqual(error.statusCode, 401);
});

test("authMiddleware: authenticate valida token y usuario activo", async () => {
  const origVerify = mockPrisma(jwt, "verify", () => ({ sub: "7", email: "a@b.com", role: "docente" }));
  const origFindUser = mockPrisma(prisma.user, "findFirst", async () => ({ id: 7n, activo: true, rol: { codigo: "docente" } }));
  const req = makeReq({ headers: { authorization: "Bearer valid-token" } });
  let nextCalled = false;
  await authenticate(req, makeRes(), () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.user.sub, "7");
  jwt.verify = origVerify;
  prisma.user.findFirst = origFindUser;
});

test("authMiddleware: authenticate lanza 401 si cuenta inactiva", async () => {
  const origVerify = mockPrisma(jwt, "verify", () => ({ sub: "7", email: "a@b.com", role: "docente" }));
  const origFindUser = mockPrisma(prisma.user, "findFirst", async () => null);
  const req = makeReq({ headers: { authorization: "Bearer token" } });
  let error;
  await authenticate(req, makeRes(), (e) => { error = e; });
  assert.ok(error);
  assert.strictEqual(error.statusCode, 401);
  jwt.verify = origVerify;
  prisma.user.findFirst = origFindUser;
});

test("authMiddleware: authenticate con sid verifica sesión activa", async () => {
  const origVerify = mockPrisma(jwt, "verify", () => ({ sub: "7", email: "a@b.com", role: "docente", sid: "9" }));
  const origFindUser = mockPrisma(prisma.user, "findFirst", async () => ({ id: 7n, activo: true, rol: { codigo: "docente" } }));
  const origFindSession = mockPrisma(prisma.session, "findFirst", async () => ({ id: 9n }));
  const req = makeReq({ headers: { authorization: "Bearer token" } });
  let nextCalled = false;
  await authenticate(req, makeRes(), () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  jwt.verify = origVerify;
  prisma.user.findFirst = origFindUser;
  prisma.session.findFirst = origFindSession;
});

test("authMiddleware: authenticate con sid pero sesión revocada lanza 401", async () => {
  const origVerify = mockPrisma(jwt, "verify", () => ({ sub: "7", email: "a@b.com", role: "docente", sid: "9" }));
  const origFindUser = mockPrisma(prisma.user, "findFirst", async () => ({ id: 7n, activo: true, rol: { codigo: "docente" } }));
  const origFindSession = mockPrisma(prisma.session, "findFirst", async () => null);
  const req = makeReq({ headers: { authorization: "Bearer token" } });
  let error;
  await authenticate(req, makeRes(), (e) => { error = e; });
  assert.ok(error);
  assert.strictEqual(error.statusCode, 401);
  jwt.verify = origVerify;
  prisma.user.findFirst = origFindUser;
  prisma.session.findFirst = origFindSession;
});

test("authMiddleware: authenticate con token inválido lanza 401", async () => {
  const origVerify = mockPrisma(jwt, "verify", () => { throw new Error("invalid"); });
  const req = makeReq({ headers: { authorization: "Bearer bad" } });
  let error;
  await authenticate(req, makeRes(), (e) => { error = e; });
  assert.ok(error);
  assert.strictEqual(error.statusCode, 401);
  jwt.verify = origVerify;
});

test("authMiddleware: authorize permite rol listado", () => {
  const req = { user: { role: "docente" } };
  let nextCalled = false;
  authorize("docente", "admin")(req, {}, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
});

test("authMiddleware: authorize deniega 401 sin usuario", () => {
  const req = {};
  let error;
  authorize("admin")(req, {}, (e) => { error = e; });
  assert.ok(error);
  assert.strictEqual(error.statusCode, 401);
});

test("authMiddleware: authorize deniega 403 rol no permitido", () => {
  const req = { user: { role: "estudiante" } };
  let error;
  authorize("docente", "admin")(req, {}, (e) => { error = e; });
  assert.ok(error);
  assert.strictEqual(error.statusCode, 403);
  assert.strictEqual(error.code, "FORBIDDEN");
});
