import test from "node:test";
import assert from "node:assert/strict";
import { prisma, prismaExecOrThrow } from "../../src/utils/prisma.js";

test("prisma es una instancia de PrismaClient", () => {
  assert.ok(prisma);
  assert.strictEqual(typeof prisma.\$connect, "function");
});

test("prismaExecOrThrow es una función", () => {
  assert.strictEqual(typeof prismaExecOrThrow, "function");
});
