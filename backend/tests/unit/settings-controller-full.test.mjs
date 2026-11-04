import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { getSettings, updateSettings } = await import("../../src/controllers/settings.controller.js");

const makeRes = () => {
  const res = {
    status: (code) => ({ json: (body) => { res.body = body; res.statusCode = code; return res; } }),
    statusCode: 200,
    body: null,
  };
  return res;
};

const nextFn = (e) => { throw e; };

test("settings: getSettings devuelve nivel alto", async () => {
  const orig = mockPrisma(prisma.systemConfig, "findUnique", async ({ where }) => {
    if (where.clave === "alertas.nivel_minimo") return { valor: "alto" };
    return null;
  });
  const origAudit = mockPrisma(prisma.auditLog, "create", async () => ({}));
  const res = makeRes();
  await getSettings({}, res, nextFn);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.data.nivelMinimoAlerta, "alto");
  prisma.systemConfig.findUnique = orig;
  prisma.auditLog.create = origAudit;
});

test("settings: getSettings devuelve medio cuando config es medio", async () => {
  const orig = mockPrisma(prisma.systemConfig, "findUnique", async ({ where }) => {
    if (where.clave === "alertas.nivel_minimo") return { valor: "medio" };
    return null;
  });
  const origAudit = mockPrisma(prisma.auditLog, "create", async () => ({}));
  const res = makeRes();
  await getSettings({}, res, nextFn);
  assert.strictEqual(res.body.data.nivelMinimoAlerta, "medio");
  prisma.systemConfig.findUnique = orig;
  prisma.auditLog.create = origAudit;
});

test("settings: getSettings devuelve medio cuando no hay config", async () => {
  const orig = mockPrisma(prisma.systemConfig, "findUnique", async () => null);
  const origAudit = mockPrisma(prisma.auditLog, "create", async () => ({}));
  const res = makeRes();
  await getSettings({}, res, nextFn);
  assert.strictEqual(res.body.data.nivelMinimoAlerta, "medio");
  prisma.systemConfig.findUnique = orig;
  prisma.auditLog.create = origAudit;
});

test("settings: getSettings devuelve medio cuando no hay config", async () => {
  const orig = mockPrisma(prisma.systemConfig, "findUnique", async () => null);
  const origAudit = mockPrisma(prisma.auditLog, "create", async () => ({}));
  const res = makeRes();
  await getSettings({}, res, nextFn);
  assert.strictEqual(res.body.data.nivelMinimoAlerta, "medio");
  prisma.systemConfig.findUnique = orig;
  prisma.auditLog.create = origAudit;
});

test("settings: updateSettings guarda y audita", async () => {
  const origUpsert = mockPrisma(prisma.systemConfig, "upsert", async () => ({}));
  const origTx = mockPrisma(prisma, "$transaction", async (fn) => fn(prisma));
  const origAudit = mockPrisma(prisma.auditLog, "create", async () => ({}));
  const res = makeRes();
  await updateSettings(
    { body: { nivelMinimoAlerta: "alto" }, user: { sub: "7" }, ip: "127.0.0.1" },
    res,
    nextFn,
  );
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.data.nivelMinimoAlerta, "alto");
  prisma.systemConfig.upsert = origUpsert;
  prisma.$transaction = origTx;
  prisma.auditLog.create = origAudit;
});

test("settings: updateSettings rechaza nivel inválido", async () => {
  const res = makeRes();
  let error;
  try {
    await updateSettings(
      { body: { nivelMinimoAlerta: "invalido" }, user: { sub: "7" }, ip: "127.0.0.1" },
      res,
      nextFn,
    );
  } catch (e) { error = e; }
  assert.ok(error);
  prisma.systemConfig.upsert = prisma.systemConfig.upsert;
});
