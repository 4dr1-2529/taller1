import test from "node:test";
import assert from "node:assert/strict";

// Mock de prisma antes de importar el módulo
const mockPrisma = {
  user: {
    findMany: async () => [],
  },
  enrollment: {
    findFirst: async () => null,
  },
};

process.env.DATABASE_URL = "mysql://localhost:33316/test_db";
process.env.JWT_SECRET = "este_es_un_secreto_de_prueba_de_al_mas_32_caracteres";
process.env.NODE_ENV = "test";

import { allowedDirectRoles, assertDirectConversation } from "../../src/services/message-policy.service.js";
import { prisma as realPrisma } from "../../src/utils/prisma.js";

// Sobrescribir prisma con mock
Object.assign(realPrisma, mockPrisma);

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

test("assertDirectConversation lanza 403 si no hay usuarios", async () => {
  mockPrisma.user.findMany = async () => [];
  try {
    await assertDirectConversation("1", "2");
    assert.fail("Debería haber lanzado AppError");
  } catch (err) {
    assert.strictEqual(err.statusCode, 403);
    assert.strictEqual(err.message, "Relación de mensajería no permitida");
  }
});

test("assertDirectConversation lanza 403 si roles no permitidos", async () => {
  mockPrisma.user.findMany = async () => [
    { id: 1n, rol: { codigo: "estudiante" } },
    { id: 2n, rol: { codigo: "estudiante" } },
  ];
  try {
    await assertDirectConversation("1", "2");
    assert.fail("Debería haber lanzado AppError");
  } catch (err) {
    assert.strictEqual(err.statusCode, 403);
    assert.strictEqual(err.message, "Relación de mensajería no permitida");
  }
});

test("assertDirectConversation permite admin-docente", async () => {
  mockPrisma.user.findMany = async () => [
    { id: 1n, rol: { codigo: "admin" } },
    { id: 2n, rol: { codigo: "docente" } },
  ];
  mockPrisma.enrollment.findFirst = async () => null;
  // admin-docente no requiere enrollamiento, solo retorna
  try {
    await assertDirectConversation("1", "2");
    // Si llega aquí, pasó
  } catch (err) {
    assert.fail(`No debería haber lanzado error: ${err.message}`);
  }
});

test("assertDirectConversation permite docente-estudiante con enrollamiento", async () => {
  mockPrisma.user.findMany = async () => [
    { id: 1n, rol: { codigo: "docente" } },
    { id: 2n, rol: { codigo: "estudiante" } },
  ];
  mockPrisma.enrollment.findFirst = async () => ({ id: 1n });
  try {
    await assertDirectConversation("1", "2");
    // Si llega aquí, pasó
  } catch (err) {
    assert.fail(`No debería haber lanzado error: ${err.message}`);
  }
});

test("assertDirectConversation lanza 403 si docente-estudiante sin enrollamiento", async () => {
  mockPrisma.user.findMany = async () => [
    { id: 1n, rol: { codigo: "docente" } },
    { id: 2n, rol: { codigo: "estudiante" } },
  ];
  mockPrisma.enrollment.findFirst = async () => null;
  try {
    await assertDirectConversation("1", "2");
    assert.fail("Debería haber lanzado AppError");
  } catch (err) {
    assert.strictEqual(err.statusCode, 403);
    assert.strictEqual(err.message, "Profesor y estudiante no comparten un curso activo en 2026");
  }
});
