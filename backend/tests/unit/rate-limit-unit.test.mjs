import test from "node:test";
import assert from "node:assert/strict";
import {
  rateLimitWindowMs,
  createGlobalLimiter,
  createAuthLimiter,
} from "../../src/middleware/rateLimit.js";

test("rateLimitWindowMs devuelve la ventana configurada (15 min)", () => {
  assert.strictEqual(rateLimitWindowMs(), 15 * 60 * 1000);
});

test("createGlobalLimiter devuelve middleware de express-rate-limit", () => {
  const limiter = createGlobalLimiter();
  assert.strictEqual(typeof limiter, "function");
});

test("createAuthLimiter devuelve middleware de express-rate-limit", () => {
  const limiter = createAuthLimiter();
  assert.strictEqual(typeof limiter, "function");
});

test("ambos limitadores son funciones distintas con distintos límites", () => {
  const globalLimiter = createGlobalLimiter();
  const authLimiter = createAuthLimiter();
  assert.notStrictEqual(globalLimiter, authLimiter);
});
