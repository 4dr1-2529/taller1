import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { listMessageRooms } from "../../src/controllers/messages.controller.js";

function replace(target, key, implementation, restore) { const original = target[key]; target[key] = implementation; restore.push(() => { target[key] = original; }); }
function response() { return { body: undefined, status() { return this; }, json(body) { this.body = body; return this; } }; }

test("listMessageRooms docente separa avisos académicos y directos, deduplicando alumnos", async () => {
  const restore = [];
  replace(prisma.teacher, "findFirst", async () => ({ id: 6n }), restore);
  replace(prisma.course, "findMany", async () => [{ id: 90n, nombre: "Matemática", cursoCatalogo: { nombre: "Matemática" } }], restore);
  replace(prisma.enrollment, "findMany", async () => [
    { student: { usuarioId: 7n, nombres: "Ana", apellidos: "Paz" } },
    { student: { usuarioId: 7n, nombres: "Ana", apellidos: "Paz" } },
    { student: { usuarioId: null, nombres: "Sin", apellidos: "Cuenta" } },
  ], restore);
  replace(prisma.user, "findMany", async () => [{ id: 1n, nombres: "Dir", apellidos: "Ector" }], restore);
  try {
    for (const [path, expected] of [
      ["/messages", ["direct:2:7", "direct:1:2"]],
      ["/announcements", ["global:institucional", "curso:90"]],
    ]) {
      const res = response(); let error;
      await listMessageRooms({ user: { sub: "2", role: "docente" }, path }, res, (e) => { error = e; });
      assert.ifError(error);
      assert.deepEqual(res.body.data.rooms.map((room) => room.roomId), expected);
      if (path === "/messages") assert.equal(res.body.data.rooms[0].label, "Ana Paz");
      else assert.match(res.body.data.rooms[1].label, /Matemática/);
    }
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("listMessageRooms docente sin perfil conserva solo el canal global", async () => {
  const restore = [];
  replace(prisma.teacher, "findFirst", async () => null, restore);
  replace(prisma.user, "findMany", async () => [], restore);
  try {
    const res = response(); let error;
    await listMessageRooms({ user: { sub: "2", role: "docente" }, path: "/announcements" }, res, (e) => { error = e; });
    assert.ifError(error);
    assert.deepEqual(res.body.data.rooms, [{ roomId: "global:institucional", label: "Avisos globales", scope: "global" }]);
  } finally { restore.reverse().forEach((fn) => fn()); }
});

