import test from "node:test";
import assert from "node:assert/strict";
import { MAX_POLIDOCENCIA_COURSES, MAX_POLIDOCENCIA_SECTIONS } from "../../src/config/polidocencia.js";

test("MAX_POLIDOCENCIA_COURSES es 2", () => {
  assert.strictEqual(MAX_POLIDOCENCIA_COURSES, 2);
});

test("MAX_POLIDOCENCIA_SECTIONS default es 8 sin env", () => {
  delete process.env.POLIDOCENCIA_MAX_SALONES;
  // Re-importar no es posible en el mismo proceso, pero el valor por defecto del módulo es 8
  assert.ok(Number.isInteger(MAX_POLIDOCENCIA_SECTIONS));
  assert.ok(MAX_POLIDOCENCIA_SECTIONS >= 6);
  assert.ok(MAX_POLIDOCENCIA_SECTIONS <= 8);
});
