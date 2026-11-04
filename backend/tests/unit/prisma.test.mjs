import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

test("prisma es una instancia de PrismaClient", () => {
  assert.ok(prisma);
  assert.strictEqual(typeof prisma.$connect, "function");
  assert.strictEqual(typeof prisma.$disconnect, "function");
});

test("prisma tiene métodos esperados del cliente", () => {
  for (const method of ["$connect", "$disconnect", "$queryRaw", "$executeRaw"]) {
    assert.strictEqual(typeof prisma[method], "function", `${method} debe existir en PrismaClient`);
  }
});
