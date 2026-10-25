import test from "node:test";
import assert from "node:assert/strict";
import { allowedDirectRoles } from "../../src/services/message-policy.service.js";

test("allowedDirectRoles admin-docente => true", () => {
  assert.strictEqual(allowedDirectRoles("admin", "docente"), true);
});

test("allowedDirectRoles docente-admin => true", () => {
  assert.strictEqual(allowedDirectRoles("docente", "admin"), true);
});

test("allowedDirectRoles docente-estudiante => true", () => {
  assert.strictEqual(allowedDirectRoles("docente", "estudiante"), true);
});

test("allowedDirectRoles estudiante-docente => true", () => {
  assert.strictEqual(allowedDirectRoles("estudiante", "docente"), true);
});

test("allowedDirectRoles admin-admin => false", () => {
  assert.strictEqual(allowedDirectRoles("admin", "admin"), false);
});

test("allowedDirectRoles docente-docente => false", () => {
  assert.strictEqual(allowedDirectRoles("docente", "docente"), false);
});

test("allowedDirectRoles estudiante-estudiante => false", () => {
  assert.strictEqual(allowedDirectRoles("estudiante", "estudiante"), false);
});

test("allowedDirectRoles admin-estudiante => false", () => {
  assert.strictEqual(allowedDirectRoles("admin", "estudiante"), false);
});

test("allowedDirectRoles estudiante-admin => false", () => {
  assert.strictEqual(allowedDirectRoles("estudiante", "admin"), false);
});
