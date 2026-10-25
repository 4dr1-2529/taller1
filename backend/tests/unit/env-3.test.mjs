import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// Guardar el entorno original
const origEnv = { ...process.env };

test("env maneja DATABASE_URL faltante", () => {
  delete process.env.DATABASE_URL;
  const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
  });
  const result = envSchema.safeParse(process.env);
  assert.ok(!result.success);
  assert.ok(result.error.issues.some((i) => i.path.includes("DATABASE_URL")));
  process.env.DATABASE_URL = origEnv.DATABASE_URL || "";
});

test("env maneja JWT_SECRET faltante", () => {
  delete process.env.JWT_SECRET;
  const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
  });
  const result = envSchema.safeParse(process.env);
  assert.ok(!result.success);
  assert.ok(result.error.issues.some((i) => i.path.includes("JWT_SECRET")));
  process.env.JWT_SECRET = origEnv.JWT_SECRET || "";
});

test("env maneja JWT_SECRET corto", () => {
  process.env.JWT_SECRET = "corto";
  const envSchema = z.object({
    JWT_SECRET: z.string().min(32),
  });
  const result = envSchema.safeParse(process.env);
  assert.ok(!result.success);
  process.env.JWT_SECRET = origEnv.JWT_SECRET || "";
});

test("env NODE_ENV acepta development, production, test", () => {
  const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]),
  });
  for (const env of ["development", "production", "test"]) {
    process.env.NODE_ENV = env;
    const result = envSchema.safeParse(process.env);
    assert.ok(result.success, `NODE_ENV=${env} debería ser válido`);
  }
  process.env.NODE_ENV = origEnv.NODE_ENV || "development";
});

test("env RATE_LIMIT_WINDOW_MS convierte a número", () => {
  process.env.RATE_LIMIT_WINDOW_MS = "300000";
  const envSchema = z.object({
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
  });
  const result = envSchema.safeParse(process.env);
  assert.ok(result.success);
  assert.strictEqual(result.data.RATE_LIMIT_WINDOW_MS, 300000);
  delete process.env.RATE_LIMIT_WINDOW_MS;
});

test("env RATE_LIMIT_MAX convierte a número", () => {
  process.env.RATE_LIMIT_MAX = "12000";
  const envSchema = z.object({
    RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  });
  const result = envSchema.safeParse(process.env);
  assert.ok(result.success);
  assert.strictEqual(result.data.RATE_LIMIT_MAX, 12000);
  delete process.env.RATE_LIMIT_MAX;
});

test("env AUTH_RATE_LIMIT_MAX convierte a número", () => {
  process.env.AUTH_RATE_LIMIT_MAX = "100";
  const envSchema = z.object({
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  });
  const result = envSchema.safeParse(process.env);
  assert.ok(result.success);
  assert.strictEqual(result.data.AUTH_RATE_LIMIT_MAX, 100);
  delete process.env.AUTH_RATE_LIMIT_MAX;
});

test("env REFRESH_TOKEN_EXPIRES_IN acepta string", () => {
  process.env.REFRESH_TOKEN_EXPIRES_IN = "7d";
  const envSchema = z.object({
    REFRESH_TOKEN_EXPIRES_IN: z.string(),
  });
  const result = envSchema.safeParse(process.env);
  assert.ok(result.success);
  assert.strictEqual(result.data.REFRESH_TOKEN_EXPIRES_IN, "7d");
  delete process.env.REFRESH_TOKEN_EXPIRES_IN;
});

test("env REFRESH_REUSE_GRACE_MS convierte a número", () => {
  process.env.REFRESH_REUSE_GRACE_MS = "30000";
  const envSchema = z.object({
    REFRESH_REUSE_GRACE_MS: z.coerce.number().int().nonnegative(),
  });
  const result = envSchema.safeParse(process.env);
  assert.ok(result.success);
  assert.strictEqual(result.data.REFRESH_REUSE_GRACE_MS, 30000);
  delete process.env.REFRESH_REUSE_GRACE_MS;
});
