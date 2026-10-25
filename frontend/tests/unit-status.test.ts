import test from "node:test";
import assert from "node:assert/strict";
import { toApiStatus, toUiStatus, toRiskEngineStatus } from "../src/lib/status.js";

test("toApiStatus devuelve activo", () => {
  assert.strictEqual(toApiStatus("activo"), "activo");
});

test("toApiStatus devuelve retirado", () => {
  assert.strictEqual(toApiStatus("retirado"), "retirado");
});

test("toUiStatus devuelve retirado para retirado", () => {
  assert.strictEqual(toUiStatus("retirado"), "retirado");
});

test("toUiStatus devuelve activo para cualquier otro valor", () => {
  assert.strictEqual(toUiStatus("activo"), "activo");
  assert.strictEqual(toUiStatus("desconocido"), "activo");
  assert.strictEqual(toUiStatus(""), "activo");
});

test("toRiskEngineStatus combina toUiStatus + toApiStatus", () => {
  assert.strictEqual(toRiskEngineStatus("retirado"), "retirado");
  assert.strictEqual(toRiskEngineStatus("activo"), "activo");
  assert.strictEqual(toRiskEngineStatus("otro"), "activo");
});
