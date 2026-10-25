import test from "node:test";
import assert from "node:assert/strict";
import { notaEstadoLabel } from "../../src/utils/grade-status.js";

test("notaEstadoLabel < 11 => Desaprobado", () => {
  assert.strictEqual(notaEstadoLabel(10), "Desaprobado");
  assert.strictEqual(notaEstadoLabel(0), "Desaprobado");
  assert.strictEqual(notaEstadoLabel(10.99), "Desaprobado");
});

test("notaEstadoLabel 11 a 13.99 => En riesgo", () => {
  assert.strictEqual(notaEstadoLabel(11), "En riesgo");
  assert.strictEqual(notaEstadoLabel(13), "En riesgo");
  assert.strictEqual(notaEstadoLabel(13.99), "En riesgo");
});

test("notaEstadoLabel >= 14 => Aprobado", () => {
  assert.strictEqual(notaEstadoLabel(14), "Aprobado");
  assert.strictEqual(notaEstadoLabel(20), "Aprobado");
  assert.strictEqual(notaEstadoLabel(15.5), "Aprobado");
});
