import test from "node:test";
import assert from "node:assert/strict";
import { formatContributionPoints, dataModeLabel } from "../src/lib/prediction-display.js";

test("formatContributionPoints redondea y agrega pts", () => {
  assert.strictEqual(formatContributionPoints(12.3), "12 pts");
  assert.strictEqual(formatContributionPoints(12.7), "13 pts");
});

test("dataModeLabel devuelve guion para undefined", () => {
  assert.strictEqual(dataModeLabel(undefined), "—");
});

test("dataModeLabel devuelve guion para null", () => {
  assert.strictEqual(dataModeLabel(null), "—");
});

test("dataModeLabel etiqueta sintético científico", () => {
  assert.strictEqual(dataModeLabel("synthetic_scientific"), "Sintético científico (V6)");
});

test("dataModeLabel etiqueta real", () => {
  assert.strictEqual(dataModeLabel("real"), "Institucional real");
});

test("dataModeLabel etiqueta sintético simple", () => {
  assert.strictEqual(dataModeLabel("synthetic"), "Sintético");
});

test("dataModeLabel devuelve valor desconocido tal cual", () => {
  assert.strictEqual(dataModeLabel("otro"), "otro");
});
