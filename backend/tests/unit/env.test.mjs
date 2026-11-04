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
  assert.ok(origins.length > 0);
  assert.strictEqual(isCorsOriginAllowed(origins[0]), true);
});

test("isCorsOriginAllowed rechaza origen no permitido", () => {
  assert.strictEqual(isCorsOriginAllowed("https://evil.com"), false);
});

test("isCorsOriginAllowed permite undefined", () => {
  assert.strictEqual(isCorsOriginAllowed(undefined), true);
});

test("isCorsOriginAllowed rechaza *.vercel.app cuando no está en CORS_ORIGIN", () => {
  const origins = corsOrigins();
  const hasVercel = origins.some((o) => o.includes(".vercel.app"));
  if (!hasVercel) {
    // Si no hay dominio vercel configurado, debe rechazar
    assert.strictEqual(isCorsOriginAllowed("https://mi-app.vercel.app"), false);
  }
});

test("corsOrigins filtra entradas vacías", () => {
  const origins = corsOrigins();
  for (const origin of origins) {
    assert.ok(origin.length > 0);
  }
});
