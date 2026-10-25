import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import { AppError } from "../../src/middleware/errorHandler.js";
import { ZodError } from "zod";
import { z } from "zod";

function makeRes() {
  const chunks = [];
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return res;
}

test("errorHandler maneja ZodError", () => {
  const schema = z.object({ email: z.string().email() });
  const result = schema.safeParse({ email: "no-email" });
  assert.ok(!result.success);
  const err = result.error;
  const res = makeRes();
  errorHandler(err, {}, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Datos inválidos");
  assert.ok(Array.isArray(res.body.errors));
});

test("errorHandler maneja AppError con código", () => {
  const err = new AppError(409, "Duplicado", "DUPLICATE");
  const res = makeRes();
  errorHandler(err, {}, res, () => {});
  assert.strictEqual(res.statusCode, 409);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Duplicado");
  assert.strictEqual(res.body.errors[0].field, "_form");
  assert.strictEqual(res.body.errors[0].message, "DUPLICATE");
});

test("errorHandler maneja AppError sin código", () => {
  const err = new AppError(400, "Mensaje simple");
  const res = makeRes();
  errorHandler(err, {}, res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Mensaje simple");
  assert.strictEqual(res.body.errors.length, 0);
});

test("errorHandler maneja P2002", () => {
  const err = { code: "P2002" };
  const res = makeRes();
  errorHandler(err, {}, res, () => {});
  assert.strictEqual(res.statusCode, 409);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "DNI, correo, código o registro duplicado");
});

test("errorHandler maneja error desconocido en desarrollo", () => {
  process.env.NODE_ENV = "development";
  const err = new Error("algo inesperado");
  const res = makeRes();
  errorHandler(err, {}, res, () => {});
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Error interno del servidor");
});

test("errorHandler maneja error desconocido en producción", () => {
  process.env.NODE_ENV = "production";
  const err = new Error("algo inesperado");
  const res = makeRes();
  errorHandler(err, {}, res, () => {});
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, "Error interno del servidor");
});
