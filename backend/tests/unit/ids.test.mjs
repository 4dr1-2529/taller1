import test from "node:test";
import assert from "node:assert/strict";
import { toDbId, idToString, paramBigIntId } from "../../src/utils/ids.js";

test("toDbId con string numérica", () => {
  assert.strictEqual(toDbId("123"), 123n);
});

test("toDbId con bigint", () => {
  assert.strictEqual(toDbId(456n), 456n);
});

test("toDbId con number", () => {
  assert.strictEqual(toDbId(789), 789n);
});

test("toDbid lanza con string no numérica", () => {
  assert.throws(() => toDbId("abc"), { message: "Identificador inválido" });
});

test("toDbid lanza con string vacía", () => {
  assert.throws(() => toDbId(""), { message: "Identificador inválido" });
});

test("idToString convierte bigint a string", () => {
  assert.strictEqual(idToString(123n), "123");
});

test("idToString convierte number a string", () => {
  assert.strictEqual(idToString(456), "456");
});

test("idToString convierte string a string", () => {
  assert.strictEqual(idToString("789"), "789");
});

test("paramBigIntId con objeto request válido", () => {
  const req = { params: { id: "42" } };
  assert.strictEqual(paramBigIntId(req), 42n);
});

test("paramBigIntId con objeto request sin id", () => {
  const req = { params: {} };
  assert.throws(() => paramBigIntId(req), { message: "Parámetro inválido" });
});
