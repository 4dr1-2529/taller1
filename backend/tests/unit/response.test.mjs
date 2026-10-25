import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  zodToFieldErrors,
  zodToErrorList,
  successPayload,
  sendSuccess,
  sendCreated,
  errorPayload,
  DEFAULT_SUCCESS_MESSAGE,
} from "../../src/utils/response.js";

test("DEFAULT_SUCCESS_MESSAGE es string no vacía", () => {
  assert.strictEqual(typeof DEFAULT_SUCCESS_MESSAGE, "string");
  assert.ok(DEFAULT_SUCCESS_MESSAGE.length > 0);
});

test("successPayload crea cuerpo válido", () => {
  const result = successPayload({ id: 1 }, "creado");
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, "creado");
  assert.deepStrictEqual(result.data, { id: 1 });
});

test("successPayload usa mensaje por defecto", () => {
  const result = successPayload({ id: 1 });
  assert.strictEqual(result.message, DEFAULT_SUCCESS_MESSAGE);
});

test("errorPayload crea cuerpo de error", () => {
  const result = errorPayload("Algo falló", [{ field: "email", message: "inválido" }]);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, "Algo falló");
  assert.deepStrictEqual(result.errors, [{ field: "email", message: "inválido" }]);
});

test("errorPayload sin errores", () => {
  const result = errorPayload("Error genérico");
  assert.strictEqual(result.success, false);
  assert.deepStrictEqual(result.errors, []);
});

test("zodToFieldErrors extrae errores de campo", () => {
  const schema = z.object({ email: z.string().email(), edad: z.number().min(0) });
  const result = schema.safeParse({ email: "no-email", edad: -5 });
  assert.ok(!result.success);
  const errors = zodToFieldErrors(result.error);
  assert.ok(Array.isArray(errors));
  assert.ok(errors.some((e) => e.field === "email"));
  assert.ok(errors.some((e) => e.field === "edad"));
});

test("zodToFieldErrors con formErrors", () => {
  const schema = z.object({ x: z.string() }).refine(() => false, { message: "error de formulario" });
  const result = schema.safeParse({ x: "a" });
  assert.ok(!result.success);
  const errors = zodToFieldErrors(result.error);
  assert.ok(errors.some((e) => e.field === "_form"));
});

test("zodToErrorList devuelve lista de strings", () => {
  const schema = z.object({ email: z.string().email() });
  const result = schema.safeParse({ email: "no-email" });
  assert.ok(!result.success);
  const list = zodToErrorList(result.error);
  assert.ok(Array.isArray(list));
  assert.ok(list.some((s) => s.includes("email")));
});

test("sendSuccess resuelve con respuesta exitosa", () => {
  const res = { status: () => ({ json: (body) => { res.body = body; return res; } }) };
  const returned = sendSuccess(res, { ok: true }, "ok", 201);
  assert.strictEqual(returned, res);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.message, "ok");
  assert.deepStrictEqual(res.body.data, { ok: true });
});

test("sendCreated usa status 201", () => {
  const res = { status: () => ({ json: (body) => { res.body = body; return res; } }) };
  sendCreated(res, { id: 1 });
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.message, "Recurso creado correctamente");
});
