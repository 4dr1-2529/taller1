import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { registerTeacher } from "../../src/services/teacher-registration.service.js";

const validInput = (overrides = {}) => ({
  dni: "12345678", nombres: "Ana", apellidos: "Paz", especialidad: "Ciencias",
  correo: "ana@example.test", telefono: "", crearCuenta: false, ...overrides,
});

function replace(target, key, implementation, restore) {
  const original = target[key];
  target[key] = implementation;
  restore.push(() => { target[key] = original; });
}

function transaction({ userDuplicate = null, teacherDuplicate = null, studentDuplicate = null, withAccount = false } = {}) {
  const calls = { createdUser: null, createdTeacher: null, audit: null };
  return {
    calls,
    tx: {
      user: {
        findFirst: async () => userDuplicate,
        create: async ({ data }) => { calls.createdUser = data; return { id: 9n }; },
      },
      teacher: {
        findFirst: async () => teacherDuplicate,
        findMany: async () => [{ codigo: "PROF-004" }],
        create: async ({ data }) => { calls.createdTeacher = data; return { id: 10n, ...data }; },
      },
      student: { findFirst: async () => studentDuplicate },
      role: { findUniqueOrThrow: async () => ({ id: 2n }) },
      correlativo: {
        upsert: async () => ({}),
        updateMany: async () => ({}),
        update: async () => ({ ultimoNumero: 5 }),
      },
      auditLog: { create: async ({ data }) => { calls.audit = data; return {}; } },
    },
  };
}

test("registerTeacher rejects duplicates in each account table", async () => {
  const restore = [];
  const cases = [
    { userDuplicate: { id: 1n } },
    { teacherDuplicate: { id: 2n } },
    { studentDuplicate: { id: 3n } },
  ];
  for (const duplicates of cases) {
    const fixture = transaction(duplicates);
    replace(prisma, "$transaction", async (callback) => callback(fixture.tx), restore);
    await assert.rejects(registerTeacher(validInput(), "1"), (error) => error.statusCode === 409);
    restore.pop()();
  }
});

test("registerTeacher creates a profile without account and an account when requested", async () => {
  const restore = [];
  const fixture = transaction();
  replace(prisma, "$transaction", async (callback) => callback(fixture.tx), restore);
  try {
    const profile = await registerTeacher(validInput(), "7", "127.0.0.1");
    assert.equal(profile.codigo, "PROF-005");
    assert.equal(fixture.calls.createdUser, null);
    assert.equal(fixture.calls.createdTeacher.usuarioId, undefined);
    assert.equal(fixture.calls.audit.usuarioId, 7n);

    const accountFixture = transaction();
    prisma.$transaction = async (callback) => callback(accountFixture.tx);
    const withAccount = await registerTeacher(validInput({ crearCuenta: true, password: "StrongPass1" }), "8");
    assert.equal(withAccount.usuarioId, 9n);
    assert.equal(accountFixture.calls.createdUser.passwordHash.length > 0, true);
    assert.equal(accountFixture.calls.audit.ipAddress, undefined);
  } finally { restore.reverse().forEach((fn) => fn()); }
});
