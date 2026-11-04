import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { sendMessage, publishAnnouncement } from "../../src/controllers/messages.controller.js";

function replace(target, key, implementation, restore) { const original = target[key]; target[key] = implementation; restore.push(() => { target[key] = original; }); }
function response() { return { statusCode: 200, body: undefined, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }

test("sendMessage crea comunicado global, recibos de lectura y auditoría", async () => {
  const restore = []; const calls = { room: null, message: null, recipients: null, ownRead: null, audit: null };
  replace(prisma.user, "findUnique", async () => ({ id: 2n, rol: { codigo: "admin" } }), restore);
  replace(prisma.mensajeSala, "upsert", async (args) => { calls.room = args; return { id: 5n, roomId: "global:institucional", alcance: "global" }; }, restore);
  replace(prisma.chatMessage, "create", async (args) => { calls.message = args; return { id: 9n, sala: { roomId: "global:institucional", alcance: "global" }, remitente: { id: 2n, nombres: "Ana", apellidos: "Sol", rol: { codigo: "admin" } }, destinatarioId: null, contenido: "Comunicado", createdAt: new Date("2026-06-01"), lecturas: [] }; }, restore);
  replace(prisma.user, "findMany", async (args) => { assert.deepEqual(args.where.id, { not: 2n }); return [{ id: 3n }, { id: 4n }]; }, restore);
  replace(prisma.messageRead, "createMany", async (args) => { calls.recipients = args; return { count: 2 }; }, restore);
  replace(prisma.messageRead, "upsert", async (args) => { calls.ownRead = args; }, restore);
  replace(prisma.auditLog, "create", async (args) => { calls.audit = args; }, restore);
  try {
    const res = response(); let error;
    await publishAnnouncement({ user: { sub: "2", role: "admin" }, body: { scope: "global", contenido: "Comunicado" }, ip: "127.0.0.1" }, res, (e) => { error = e; });
    assert.ifError(error);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.message.id, "9");
    assert.equal(calls.room.create.roomId, "global:institucional");
    assert.equal(calls.message.data.contenido, "Comunicado");
    assert.deepEqual(calls.recipients.data.map((r) => r.usuarioId), [3n, 4n]);
    assert.equal(calls.ownRead.create.leido, true);
    assert.equal(calls.audit.data.entidad, "Aviso");
    assert.equal(calls.audit.data.accion, "CREATE");
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("sendMessage autoriza, ordena y persiste una conversación directa entre director y profesor", async () => {
  const restore = [];
  const calls = { room: null, message: null, receipts: null };
  replace(prisma.user, "findUnique", async () => ({ id: 2n, rol: { codigo: "admin" } }), restore);
  replace(prisma.user, "findMany", async () => [
    { id: 2n, activo: true, rol: { codigo: "admin" } },
    { id: 3n, activo: true, rol: { codigo: "docente" } },
  ], restore);
  replace(prisma.mensajeSala, "upsert", async (args) => {
    calls.room = args;
    return { id: 5n, roomId: "direct:2:3", alcance: "directo" };
  }, restore);
  replace(prisma.chatMessage, "create", async (args) => {
    calls.message = args;
    return {
      id: 10n, contenido: "Hola", createdAt: new Date("2026-11-01"), destinatarioId: 3n,
      sala: { roomId: "direct:2:3", alcance: "directo" },
      remitente: { id: 2n, nombres: "Ana", apellidos: "Paz", rol: { codigo: "admin" } },
      lecturas: [],
    };
  }, restore);
  replace(prisma.messageRead, "createMany", async (args) => { calls.receipts = args; }, restore);
  replace(prisma.messageRead, "upsert", async () => undefined, restore);
  replace(prisma.auditLog, "create", async () => ({}), restore);
  try {
    const res = response(); let error;
    await sendMessage({
      user: { sub: "2", role: "admin" },
      body: { scope: "directo", recipientUserId: "3", contenido: "Hola" },
      ip: "127.0.0.1",
    }, res, (e) => { error = e; });
    assert.ifError(error);
    assert.equal(res.statusCode, 201);
    assert.equal(calls.room.create.roomId, "direct:2:3");
    assert.equal(calls.message.data.destinatarioId, 3n);
    assert.deepEqual(calls.receipts.data.map((row) => row.usuarioId), [3n]);
    assert.equal(res.body.data.message.leida, false);
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("sendMessage rechaza comunicados globales de un profesor", async () => {
  const restore = [];
  replace(prisma.user, "findUnique", async () => ({ id: 8n, rol: { codigo: "docente" } }), restore);
  try {
    let error;
    await publishAnnouncement({ user: { sub: "8", role: "docente" }, body: { scope: "global", contenido: "No autorizado" } }, response(), (e) => { error = e; });
    assert.equal(error.statusCode, 403);
    assert.match(error.message, /Solo el director/);
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("publishAnnouncement rechaza respuestas y scopes de mensajería directa", async () => {
  const restore = [];
  replace(prisma.user, "findUnique", async () => ({ id: 2n, rol: { codigo: "admin" } }), restore);
  try {
    for (const body of [{ scope: "global", contenido: "x", parentMessageId: "1" }, { scope: "directo", contenido: "x" }]) {
      let error;
      await publishAnnouncement({ user: { sub: "2", role: "admin" }, body }, response(), (e) => { error = e; });
      assert.equal(error.statusCode, 403);
    }
  } finally { restore.reverse().forEach((fn) => fn()); }
});


