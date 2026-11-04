import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { me } from "../../src/controllers/auth.controller.js";

function replace(target, key, implementation) { const original = target[key]; target[key] = implementation; return () => { target[key] = original; }; }
function response() { return { statusCode: 200, body: undefined, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }

test("me devuelve el usuario con rol, profesor e identificadores serializados", async () => {
  const restore = replace(prisma.user, "findUnique", async (args) => {
    assert.equal(args.where.id, 12n);
    return { id: 12n, email: "ana@example.edu", nombres: "Ana", apellidos: "Sol", activo: true,
      createdAt: new Date("2026-01-02T00:00:00Z"), rol: { codigo: "docente" },
      profesor: { id: 8n, codigo: "DOC-8", especialidad: "Ciencias" } };
  });
  try {
    const res = response(); let error;
    await me({ user: { sub: "12" } }, res, (e) => { error = e; });
    assert.ifError(error);
    assert.equal(res.body.data.user.id, "12");
    assert.equal(res.body.data.user.role, "docente");
    assert.equal(res.body.data.user.teacherId, "8");
    assert.equal(res.body.data.user.profesor.codigo, "DOC-8");
  } finally { restore(); }
});

test("me propaga 404 cuando el usuario autenticado ya no existe", async () => {
  const restore = replace(prisma.user, "findUnique", async () => null);
  try {
    let error;
    await me({ user: { sub: "12" } }, response(), (e) => { error = e; });
    assert.equal(error.statusCode, 404);
    assert.match(error.message, /Usuario no encontrado/);
  } finally { restore(); }
});
