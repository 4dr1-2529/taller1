import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { getRolId, getUserRolCodigo, mapUserWithRole } = await import("../../src/utils/rol.js");

test("rol: getRolId devuelve el id del rol", async () => {
  const orig = mockPrisma(prisma.role, "findUnique", async () => ({ id: 3n, codigo: "docente" }));
  const result = await getRolId("docente");
  assert.strictEqual(result, 3n);
  prisma.role.findUnique = orig;
});

test("rol: getRolId lanza 500 si rol no configurado", async () => {
  const orig = mockPrisma(prisma.role, "findUnique", async () => null);
  let error;
  try { await getRolId("inexistente"); } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 500);
  prisma.role.findUnique = orig;
});

test("rol: getUserRolCodigo devuelve el código del rol", async () => {
  const orig = mockPrisma(prisma.user, "findUnique", async () => ({ id: 7n, rol: { codigo: "docente" } }));
  const result = await getUserRolCodigo("7");
  assert.strictEqual(result, "docente");
  prisma.user.findUnique = orig;
});

test("rol: getUserRolCodigo devuelve null si no hay usuario", async () => {
  const orig = mockPrisma(prisma.user, "findUnique", async () => null);
  const result = await getUserRolCodigo("99");
  assert.strictEqual(result, null);
  prisma.user.findUnique = orig;
});

test("rol: mapUserWithRole reemplaza rol por código", () => {
  const user = { id: 7n, nombres: "Ana", rol: { codigo: "admin" } };
  const result = mapUserWithRole(user);
  assert.deepStrictEqual(result, { id: 7n, nombres: "Ana", role: "admin" });
});

test("rol: mapUserWithRole no muta entrada", () => {
  const user = { id: 1n, rol: { codigo: "docente" } };
  mapUserWithRole(user);
  assert.strictEqual(user.rol.codigo, "docente");
});
