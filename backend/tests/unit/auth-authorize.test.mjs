import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../src/middleware/errorHandler.js";
import { authorize } from "../../src/middleware/auth.js";

test("authorize permite cuando el rol del usuario está listado", () => {
  let nextCalled = false;
  const req = { user: { role: "docente" } };
  authorize("docente", "admin")(req, {}, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
});

test("authorize permite cualquier rol cuando no se restringe", () => {
  let nextCalled = false;
  const req = { user: { role: "estudiante" } };
  authorize()(req, {}, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
});

test("authorize deniega con 401 cuando no hay usuario autenticado", () => {
  let error;
  const req = {};
  authorize("admin")(req, {}, (err) => { error = err; });
  assert.ok(error instanceof AppError);
  assert.strictEqual(error.statusCode, 401);
  assert.strictEqual(error.code, undefined);
});

test("authorize deniega con 403 cuando el rol no está permitido", () => {
  let error;
  const req = { user: { role: "estudiante" } };
  authorize("docente", "admin")(req, {}, (err) => { error = err; });
  assert.ok(error instanceof AppError);
  assert.strictEqual(error.statusCode, 403);
  assert.strictEqual(error.code, "FORBIDDEN");
});
