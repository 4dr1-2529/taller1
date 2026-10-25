import test from "node:test";
import assert from "node:assert/strict";
import {
  lmsCompositeScore,
  deriveLmsEngagementLevel,
  lmsActivityTierFromLevel,
  lmsActivityTierFromMetrics,
} from "../src/lib/lms-engagement.js";

test("lmsCompositeScore devuelve 0 sin datos", () => {
  assert.strictEqual(lmsCompositeScore([]), 0);
  assert.strictEqual(lmsCompositeScore([], undefined), 0);
});

test("lmsCompositeScore promedia actividadPct", () => {
  const acts = [{ actividadPct: 60, minutos: 108, conexiones: 7.5 }, { actividadPct: 60, minutos: 108, conexiones: 7.5 }];
  assert.strictEqual(lmsCompositeScore(acts), 60);
});

test("lmsCompositeScore incluye minutos normalizados", () => {
  const acts = [{ actividadPct: 100, minutos: 180, conexiones: 13 }];
  assert.strictEqual(lmsCompositeScore(acts), 100);
});

test("lmsCompositeScore incluye conexiones", () => {
  const acts = [{ actividadPct: 0, minutos: 0, conexiones: 12 }];
  assert.strictEqual(lmsCompositeScore(acts), 32);
});

test("lmsCompositeScore incluye indicador", () => {
  const ind = { frecuenciaAcceso: 50, tiempoPlataforma: 5, participacion: 80 };
  assert.strictEqual(lmsCompositeScore([], ind), 60);
});

test("deriveLmsEngagementLevel alto", () => {
  assert.strictEqual(deriveLmsEngagementLevel([], undefined), "bajo");
});

test("deriveLmsEngagementLevel medio", () => {
  const acts = [{ actividadPct: 80, minutos: 120, conexiones: 0 }];
  assert.strictEqual(deriveLmsEngagementLevel(acts, undefined), "medio");
});

test("deriveLmsEngagementLevel alto", () => {
  const acts = [{ actividadPct: 100, minutos: 180, conexiones: 0 }];
  assert.strictEqual(deriveLmsEngagementLevel(acts, undefined), "alto");
});

test("lmsActivityTierFromLevel mapea niveles", () => {
  assert.strictEqual(lmsActivityTierFromLevel("alto"), "alta");
  assert.strictEqual(lmsActivityTierFromLevel("medio"), "media");
  assert.strictEqual(lmsActivityTierFromLevel("bajo"), "baja");
  assert.strictEqual(lmsActivityTierFromLevel("desconocido"), "sin");
});

test("lmsActivityTierFromMetrics devuelve sin sin datos", () => {
  assert.strictEqual(lmsActivityTierFromMetrics(undefined, [], undefined), "sin");
});

test("lmsActivityTierFromMetrics usa engagement cuando hay datos", () => {
  const acts = [{ actividadPct: 90, minutos: 0, conexiones: 0 }];
  assert.strictEqual(lmsActivityTierFromMetrics("alto", acts, undefined), "alta");
});
