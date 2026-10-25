import test from "node:test";
import assert from "node:assert/strict";
import { applyEnvAliases, validateRailwayEnv } from "../../src/config/env-aliases.js";

test("applyEnvAliases no sobrescribe variable existente", () => {
  const env = { JWT_SECRETO: "secreto-origen", JWT_SECRET: "ya-existe" };
  const result = applyEnvAliases(env);
  assert.strictEqual(result, undefined);
  assert.strictEqual(env.JWT_SECRET, "ya-existe");
});

test("applyEnvAliases copia cuando destino no existe", () => {
  const env = { MYSQL_URL: "mysql://localhost:33316/test" };
  applyEnvAliases(env);
  assert.strictEqual(env.DATABASE_URL, "mysql://localhost:33316/test");
});

test("applyEnvAliases mapea NODE_ENV en español a inglés", () => {
  const env = { NODE_ENV: "producción" };
  applyEnvAliases(env);
  assert.strictEqual(env.NODE_ENV, "production");
});

test("applyEnvAliases mapea prueba a test", () => {
  const env = { NODE_ENV: "prueba" };
  applyEnvAliases(env);
  assert.strictEqual(env.NODE_ENV, "test");
});

test("validateRailwayEnv devuelve null cuando todo es válido", () => {
  const env = {
    DATABASE_URL: "mysql://localhost:33316/test",
    JWT_SECRET: "a".repeat(64),
    NODE_ENV: "production",
  };
  assert.strictEqual(validateRailwayEnv(env), null);
});

test("validateRailwayEnv reporta DATABASE_URL faltante", () => {
  const env = { JWT_SECRET: "a".repeat(64), NODE_ENV: "production" };
  const result = validateRailwayEnv(env);
  assert.ok(result.includes("DATABASE_URL"));
});

test("validateRailwayEnv reporta JWT_SECRET corto", () => {
  const env = { DATABASE_URL: "mysql://localhost:33316/test", JWT_SECRET: "corto", NODE_ENV: "production" };
  const result = validateRailwayEnv(env);
  assert.ok(result.includes("JWT_SECRET"));
});

test("validateRailwayEnv reporta NODE_ENV inválido", () => {
  const env = { DATABASE_URL: "mysql://localhost:33316/test", JWT_SECRET: "a".repeat(64), NODE_ENV: "invalido" };
  const result = validateRailwayEnv(env);
  assert.ok(result.includes("NODE_ENV"));
});
