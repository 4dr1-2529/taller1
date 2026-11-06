import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { listMessageRooms, listMessages, markRoomRead } from "../../src/controllers/messages.controller.js";

function mockRes() {
  return { statusCode: 200, body: undefined, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
function replace(target, key, impl) { const original = target[key]; target[key] = impl; return () => { target[key] = original; }; }
function req(user, path = "/messages", roomId = "global:institucional") { return { user, path, params: { roomId }, ip: "127.0.0.1" }; }

test("listMessageRooms limita salas admin a directos y comunicaciones a globales", async () => {
  const restore = replace(prisma.user, "findMany", async () => [{ id: 7n, nombres: "Ana", apellidos: "Paz" }]);
  try {
    const directRes = mockRes(); let error;
    await listMessageRooms(req({ sub: "2", role: "admin" }), directRes, (e) => { error = e; });
    assert.ifError(error);
    assert.deepStrictEqual(directRes.body.data.rooms, [{ roomId: "direct:2:7", label: "Ana Paz", scope: "directo" }]);
    const announcementsRes = mockRes();
    await listMessageRooms(req({ sub: "2", role: "admin" }, "/announcements"), announcementsRes, (e) => { error = e; });
    assert.ifError(error);
    assert.deepStrictEqual(announcementsRes.body.data.rooms, [
      { roomId: "global:institucional", label: "Comunicado global", scope: "global" },
    ]);
  } finally { restore(); }
});

test("listMessages mapea remitente, destinatario y lectura; sala ausente devuelve lista vacía", async () => {
  let messageQuery;
  const restore = replace(prisma.mensajeSala, "findUnique", async () => ({ id: 5n, roomId: "global:institucional", alcance: "global" }));
  const restoreMessages = replace(prisma.chatMessage, "findMany", async (args) => {
    messageQuery = args;
    return [{ id: 9n, contenido: "Aviso", createdAt: new Date("2026-06-01"), destinatarioId: null,
      sala: { roomId: "global:institucional", alcance: "global" },
      remitente: { id: 3n, nombres: "Luis", apellidos: "Sol", rol: { codigo: "docente" } },
      lecturas: [{ usuarioId: 2n, leido: true, leidoAt: new Date("2026-06-02") }] }];
  });
  try {
    const res = mockRes(); let error;
    await listMessages(req({ sub: "2", role: "estudiante" }), res, (e) => { error = e; });
    assert.ifError(error);
    assert.strictEqual(messageQuery.where.salaId, 5n);
    assert.deepStrictEqual(res.body.data.items[0], {
      id: "9", roomId: "global:institucional", scope: "global",
      remitente: { id: "3", nombre: "Luis Sol", rol: "docente" }, destinatarioId: null,
      contenido: "Aviso", fecha: new Date("2026-06-01"), leida: true, readAt: new Date("2026-06-02"),
    });
  } finally { restoreMessages(); restore(); }

  const restoreMissing = replace(prisma.mensajeSala, "findUnique", async () => null);
  const restoreNoMessages = replace(prisma.chatMessage, "findMany", async () => { assert.fail("no consulta mensajes si la sala no existe"); });
  try {
    const res = mockRes(); let error;
    await listMessages(req({ sub: "2", role: "estudiante" }), res, (e) => { error = e; });
    assert.ifError(error);
    assert.deepStrictEqual(res.body.data.items, []);
  } finally { restoreNoMessages(); restoreMissing(); }
});

test("markRoomRead actualiza cada mensaje y devuelve cero para sala inexistente", async () => {
  const calls = [];
  const restoreRoom = replace(prisma.mensajeSala, "findUnique", async () => ({ id: 5n }));
  const restoreMessages = replace(prisma.chatMessage, "findMany", async () => [{ id: 10n }, { id: 11n }]);
  const restoreRead = replace(prisma.messageRead, "upsert", async (args) => calls.push(args));
  try {
    const res = mockRes(); let error;
    await markRoomRead(req({ sub: "2", role: "estudiante" }), res, (e) => { error = e; });
    assert.ifError(error);
    assert.strictEqual(res.body.data.marked, 2);
    assert.strictEqual(calls.length, 2);
    assert.deepStrictEqual(calls[0].where, { mensajeId_usuarioId: { mensajeId: 10n, usuarioId: 2n } });
  } finally { restoreRead(); restoreMessages(); restoreRoom(); }

  const restoreMissing = replace(prisma.mensajeSala, "findUnique", async () => null);
  try {
    const res = mockRes(); let error;
    await markRoomRead(req({ sub: "2", role: "estudiante" }), res, (e) => { error = e; });
    assert.ifError(error);
    assert.strictEqual(res.body.data.marked, 0);
  } finally { restoreMissing(); }
});

test("markRoomRead aplica reglas para salas de curso, directas, institucionales y de profesores", async (t) => {
  const restore = [];
  const noRoom = replace(prisma.mensajeSala, "findUnique", async () => null);
  const activeCourse = replace(prisma.course, "findFirst", async () => ({ activo: true, anioLectivoId: 2026n, seccionId: 40n }), restore);
  const directPeers = replace(prisma.user, "findMany", async () => [
    { id: 2n, activo: true, rol: { codigo: "admin" } },
    { id: 3n, activo: true, rol: { codigo: "docente" } },
  ], restore);
  try {
    for (const [roomId, role, sub] of [
      ["curso:90", "admin", "2"],
      ["direct:2:3", "admin", "2"],
      ["global:institucional", "estudiante", "12"],
    ]) {
      await t.test(`${role} puede revisar ${roomId}`, async () => {
        const res = mockRes(); let error;
        await markRoomRead(req({ sub, role }, "/messages", roomId), res, (e) => { error = e; });
        assert.ifError(error);
        assert.equal(res.body.data.marked, 0);
      });
    }
    for (const [roomId, role] of [
      ["canal:profesores", "estudiante"],
      ["privada:90", "estudiante"],
      ["direct:3:4", "estudiante"],
    ]) {
      await t.test(`${role} no puede revisar ${roomId}`, async () => {
        const res = mockRes(); let error;
        await markRoomRead(req({ sub: "12", role }, "/messages", roomId), res, (e) => { error = e; });
        assert.equal(error.statusCode, 403);
      });
    }
  } finally { directPeers(); activeCourse(); noRoom(); restore.reverse().forEach((fn) => fn()); }
});

test("listMessageRooms cubre docente sin perfil y estudiante sin matrícula activa", async () => {
  const restoreTeacher = replace(prisma.teacher, "findFirst", async () => null);
  const restoreStudent = replace(prisma.student, "findFirst", async () => null);
  const restorePeers = replace(prisma.user, "findMany", async () => []);
  try {
    const announcements = mockRes(); let error;
    await listMessageRooms(req({ sub: "8", role: "docente" }, "/announcements"), announcements, (e) => { error = e; });
    assert.ifError(error);
    assert.deepStrictEqual(announcements.body.data.rooms, [
      { roomId: "global:institucional", label: "Avisos globales", scope: "global" },
    ]);

    const directRooms = mockRes();
    await listMessageRooms(req({ sub: "8", role: "docente" }), directRooms, (e) => { error = e; });
    assert.ifError(error);
    assert.deepStrictEqual(directRooms.body.data.rooms, []);

    const studentRooms = mockRes();
    await listMessageRooms(req({ sub: "12", role: "estudiante" }), studentRooms, (e) => { error = e; });
    assert.ifError(error);
    assert.deepStrictEqual(studentRooms.body.data.rooms, []);
  } finally { restorePeers(); restoreStudent(); restoreTeacher(); }
});

test("listMessageRooms estudiante ve cursos inscritos y un directo único por docente", async () => {
  const restore = replace(prisma.student, "findFirst", async () => ({
    inscripciones: [
      {
        cursoOfertaId: 90n,
        course: {
          cursoCatalogo: { nombre: "Matemática" },
          profesor: { usuario: { id: 8n }, nombres: "Luis", apellidos: "Sol" },
        },
      },
      {
        cursoOfertaId: 91n,
        course: {
          cursoCatalogo: { nombre: "Comunicación" },
          profesor: { usuario: { id: 8n }, nombres: "Luis", apellidos: "Sol" },
        },
      },
      {
        cursoOfertaId: 92n,
        course: { cursoCatalogo: { nombre: "Ciencias" }, profesor: null },
      },
    ],
  }));
  try {
    const messages = mockRes(); let error;
    await listMessageRooms(req({ sub: "12", role: "estudiante" }), messages, (e) => { error = e; });
    assert.ifError(error);
    assert.deepEqual(messages.body.data.rooms, [{ roomId: "direct:12:8", label: "Prof. Luis Sol", scope: "directo" }]);

    const announcements = mockRes();
    await listMessageRooms(req({ sub: "12", role: "estudiante" }, "/announcements/rooms"), announcements, (e) => { error = e; });
    assert.ifError(error);
    assert.deepEqual(announcements.body.data.rooms, [
      { roomId: "global:institucional", label: "Comunicados institucionales", scope: "global" },
      { roomId: "curso:90", label: "Avisos — Matemática", scope: "curso" },
      { roomId: "curso:91", label: "Avisos — Comunicación", scope: "curso" },
      { roomId: "curso:92", label: "Avisos — Ciencias", scope: "curso" },
    ]);
  } finally { restore(); }
});
