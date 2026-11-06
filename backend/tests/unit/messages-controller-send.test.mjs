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
      body: { scope: "directo", roomId: "direct:2:3", contenido: "Hola" },
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

test("createCommunication deniega scopes ajenos al rol y conversaciones mal formadas", async (t) => {
  const cases = [
    { name: "estudiante no publica global", role: "estudiante", announcement: false, body: { scope: "global", contenido: "x" }, status: 403 },
    { name: "docente no publica en canal de profesores", role: "docente", announcement: false, body: { scope: "profesores", contenido: "x" }, status: 403 },
    { name: "estudiante no publica aviso de curso", role: "estudiante", announcement: false, body: { scope: "curso", contenido: "x", courseId: "9" }, status: 403 },
    { name: "un aviso no admite scope de profesores", role: "admin", announcement: true, body: { scope: "profesores", contenido: "x" }, status: 403 },
    { name: "admin no publica anuncios académicos", role: "admin", announcement: true, body: { scope: "curso", contenido: "x" }, status: 403 },
    { name: "conversación directa debe incluir al remitente", role: "admin", announcement: false, body: { scope: "directo", roomId: "direct:7:8", contenido: "x" }, status: 403 },
    { name: "usuario eliminado no puede enviar", role: "admin", announcement: false, body: { scope: "directo", roomId: "direct:2:3", contenido: "x" }, missingUser: true, status: 401 },
  ];
  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      const restore = [];
      replace(prisma.user, "findUnique", async () => scenario.missingUser ? null : ({ id: 2n, rol: { codigo: scenario.role } }), restore);
      try {
        let error;
        const handler = scenario.announcement ? publishAnnouncement : sendMessage;
        await handler({ user: { sub: "2", role: scenario.role }, body: scenario.body }, response(), (e) => { error = e; });
        assert.equal(error.statusCode, scenario.status);
      } finally { restore.reverse().forEach((fn) => fn()); }
    });
  }
});

test("publishAnnouncement limita el aviso de curso del docente a su matrícula activa", async () => {
  const restore = [];
  const calls = { enrollments: null, recipients: null };
  replace(prisma.user, "findUnique", async () => ({ id: 8n, rol: { codigo: "docente" } }), restore);
  replace(prisma.teacher, "findFirst", async () => ({ id: 80n }), restore);
  replace(prisma.course, "findFirst", async () => ({ id: 90n, seccionId: 40n, anioLectivoId: 2026n, activo: true }), restore);
  replace(prisma.course, "findUnique", async () => ({ cursoId: 9n, seccionId: 40n, anioLectivoId: 2026n, activo: true, profesor: { usuarioId: 8n } }), restore);
  replace(prisma.teacherCourseAssignment, "findUnique", async () => ({ activo: true }), restore);
  replace(prisma.enrollment, "findMany", async () => {
    calls.enrollments = true;
    return [{ student: { usuarioId: 3n } }, { student: { usuarioId: null } }];
  }, restore);
  replace(prisma.mensajeSala, "upsert", async () => ({ id: 15n, roomId: "curso:90", alcance: "curso" }), restore);
  replace(prisma.chatMessage, "create", async () => ({
    id: 16n, contenido: "Repasar el tema", createdAt: new Date("2026-11-04"), destinatarioId: null,
    sala: { roomId: "curso:90", alcance: "curso" },
    remitente: { id: 8n, nombres: "Luis", apellidos: "Sol", rol: { codigo: "docente" } }, lecturas: [],
  }), restore);
  replace(prisma.messageRead, "createMany", async (args) => { calls.recipients = args; }, restore);
  replace(prisma.messageRead, "upsert", async () => undefined, restore);
  replace(prisma.auditLog, "create", async () => undefined, restore);
  try {
    const res = response(); let error;
    await publishAnnouncement({
      user: { sub: "8", role: "docente" },
      body: { scope: "curso", courseId: "90", contenido: "Repasar el tema" },
      ip: "127.0.0.1",
    }, res, (e) => { error = e; });
    assert.ifError(error);
    assert.equal(calls.enrollments, true);
    assert.deepEqual(calls.recipients.data.map((row) => row.usuarioId), [3n]);
    assert.equal(res.body.data.message.roomId, "curso:90");
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("docente inicia conversación directa con estudiante usando destinatario validado", async () => {
  const restore = [];
  const calls = { room: null, recipients: null };
  replace(prisma.user, "findUnique", async () => ({ id: 8n, rol: { codigo: "docente" } }), restore);
  replace(prisma.student, "findFirst", async () => null, restore);
  replace(prisma.user, "findMany", async () => [
    { id: 8n, activo: true, rol: { codigo: "docente" } },
    { id: 3n, activo: true, rol: { codigo: "estudiante" } },
  ], restore);
  replace(prisma.enrollment, "findFirst", async () => ({ id: 44n }), restore);
  replace(prisma.mensajeSala, "upsert", async (args) => {
    calls.room = args;
    return { id: 17n, roomId: "direct:3:8", alcance: "directo" };
  }, restore);
  replace(prisma.chatMessage, "create", async (args) => ({
    id: 18n, contenido: args.data.contenido, createdAt: new Date("2026-11-04"), destinatarioId: 3n,
    sala: { roomId: "direct:3:8", alcance: "directo" },
    remitente: { id: 8n, nombres: "Luis", apellidos: "Sol", rol: { codigo: "docente" } }, lecturas: [],
  }), restore);
  replace(prisma.messageRead, "createMany", async (args) => { calls.recipients = args; }, restore);
  replace(prisma.messageRead, "upsert", async () => undefined, restore);
  replace(prisma.auditLog, "create", async () => undefined, restore);
  try {
    const res = response(); let error;
    await sendMessage({
      user: { sub: "8", role: "docente" },
      body: { scope: "directo", recipientUserId: "3", contenido: "Hola" },
      ip: "127.0.0.1",
    }, res, (e) => { error = e; });
    assert.ifError(error);
    assert.equal(calls.room.create.roomId, "direct:3:8");
    assert.deepEqual(calls.recipients.data.map((row) => row.usuarioId), [3n]);
    assert.equal(res.body.data.message.destinatarioId, "3");
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("createCommunication bloquea salas institucionales falsificadas y respuestas fuera de sala", async (t) => {
  const scenarios = [
    {
      name: "docente no puede suplantar aviso institucional",
      body: { scope: "curso", roomId: "global:institucional", contenido: "x" },
      expected: /Solo el director puede publicar/,
      role: "docente",
      announcement: true,
      missingParent: false,
    },
    {
      name: "rechaza respuesta sin mensaje padre en la misma conversación",
      body: { scope: "directo", recipientUserId: "3", parentMessageId: "20", contenido: "x" },
      expected: /Respuesta fuera de conversación/,
      role: "admin",
      announcement: false,
      missingParent: true,
    },
  ];
  for (const scenario of scenarios) {
    await t.test(scenario.name, async () => {
      const restore = [];
      replace(prisma.user, "findUnique", async () => ({ id: 2n, rol: { codigo: scenario.role } }), restore);
      if (scenario.missingParent) {
        replace(prisma.user, "findMany", async () => [
          { id: 2n, activo: true, rol: { codigo: "admin" } },
          { id: 3n, activo: true, rol: { codigo: "docente" } },
        ], restore);
        replace(prisma.chatMessage, "findUnique", async () => null, restore);
      }
      try {
        let error;
        const handler = scenario.announcement ? publishAnnouncement : sendMessage;
        await handler({ user: { sub: "2", role: scenario.role }, body: scenario.body }, response(), (e) => { error = e; });
        assert.match(error.message, scenario.expected);
      } finally { restore.reverse().forEach((fn) => fn()); }
    });
  }
});


