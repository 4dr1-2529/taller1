import test from "node:test";
import assert from "node:assert/strict";
import { env, corsOrigins, isCorsOriginAllowed } from "../../src/config/env.js";

test("env DATABASE_URL está definida", () => {
  assert.ok(typeof env.DATABASE_URL === "string");
});

test("env JWT_SECRET está definida", () => {
  assert.ok(typeof env.JWT_SECRET === "string");
  assert.ok(env.JWT_SECRET.length >= 32);
});

test("env NODE_ENV está definida", () => {
  assert.ok(["development", "production", "test"].includes(env.NODE_ENV));
});

test("corsOrigins devuelve array", () => {
  const origins = corsOrigins();
  assert.ok(Array.isArray(origins));
  assert.ok(origins.length > 0);
});

test("isCorsOriginAllowed permite origen permitido", () => {
  const origins = corsOrigins();
  assert.ok(isCorsOriginAllowed(origins[0]));
});

test("isCorsOriginAllowed rechaza origen no permitido", () => {
  assert.strictEqual(isCorsOriginAllowed("https://evil.com"), false);
});

test("isCorsOriginAllowed permite undefined", () => {
  assert.strictEqual(isCorsOriginAllowed(undefined), true);
});

test("isCorsOriginAllowed permite *.vercel.app", () => {
  assert.ok(isCorsOriginAllowed("https://mi-app.vercel.app"));
});
