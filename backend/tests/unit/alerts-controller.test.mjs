import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { listAlerts, patchAlertStatus } from "../../src/controllers/alerts.controller.js";

function replace(target, key, impl, restore) { const original = target[key]; target[key] = impl; restore.push(() => { target[key] = original; }); }
function response() { return { statusCode: 200, body: null, status(n) { this.statusCode = n; return this; }, json(v) { this.body = v; return this; } }; }
const admin = { sub: "7", role: "admin" };

test("listAlerts applies student filters and pagination, maps factors and aggregates salons", async () => {
  const restore = [];
  let alertQuery, countQuery, salonQuery;
  const now = new Date("2026-06-01T00:00:00Z");
  const alertRow = {
    id: 5n, titulo: "Asistencia baja", descripcion: "Seguimiento", nivelRiesgo: "alto", estado: "nueva",
    score: 81, probabilidad: 0.81, recomendacion: "Contactar", createdAt: now, updatedAt: now,
    factores: [{ factorKey: "attendance", etiqueta: "Asistencia", contribucion: "12" }],
    student: { id: 20n, codigo: "E-20", nombres: "Ana", apellidos: "Sol", seccionId: 4n, seccion: { nombre: "A", grado: { numero: 2 } } },
  };
  replace(prisma.alert, "findMany", async (args) => {
    if (args.select) { salonQuery = args; return [
      { student: { seccion: { nombre: "B", grado: { numero: 3 } } } },
      { student: { seccion: { nombre: "A", grado: { numero: 2 } } } },
      { student: { seccion: { nombre: "A", grado: { numero: 2 } } } },
      { student: { seccion: null } },
    ]; }
    alertQuery = args; return [alertRow];
  }, restore);
  replace(prisma.alert, "count", async (args) => { countQuery = args; return 21; }, restore);
  try {
    const req = { user: admin, query: { level: "alto", status: "nueva", page: "2", limit: "10", seccionId: "4", search: " Ana " } };
    const res = response(); let error;
    await listAlerts(req, res, (e) => { error = e; });
    assert.ifError(error);
    assert.deepStrictEqual(alertQuery.where, {
      student: { AND: [
        { activo: true }, { seccionId: 4n },
        { OR: [{ nombres: { contains: "Ana" } }, { apellidos: { contains: "Ana" } }, { codigo: { contains: "Ana" } }] },
      ] }, estado: "nueva", nivelRiesgo: "alto",
    });
    assert.strictEqual(alertQuery.skip, 10);
    assert.strictEqual(alertQuery.take, 10);
    assert.deepStrictEqual(countQuery.where, alertQuery.where);
    assert.deepStrictEqual(salonQuery.where, alertQuery.where);
    assert.strictEqual(res.body.data.items[0].student.id, "20");
    assert.strictEqual(res.body.data.items[0].factores_riesgo[0].contribution, 12);
    assert.strictEqual(res.body.data.items[0].estado_label, "Nueva");
    assert.deepStrictEqual(res.body.data.salonSummary, [{ salon: "2°A", count: 2 }, { salon: "3°B", count: 1 }]);
    assert.strictEqual(res.body.data.pages, 3);
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("listAlerts caps page size and shows open statuses by default; unknown filters are ignored", async () => {
  const restore = [];
  let query;
  replace(prisma.alert, "findMany", async (args) => { if (!args.select) query = args; return []; }, restore);
  replace(prisma.alert, "count", async () => 0, restore);
  try {
    const res = response(); let error;
    await listAlerts({ user: admin, query: { page: "-2", limit: "999", level: "critical", status: "unknown" } }, res, (e) => { error = e; });
    assert.ifError(error);
    assert.deepStrictEqual(query.where.estado, { in: ["nueva", "en_seguimiento"] });
    assert.strictEqual(query.where.nivelRiesgo, undefined);
    assert.deepStrictEqual(query.where.student, { AND: [{ activo: true }] });
    assert.strictEqual(query.skip, 0);
    assert.strictEqual(query.take, 200);
    assert.strictEqual(res.body.data.pages, 1);
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("patchAlertStatus validates scope, writes history and audit in one transaction", async () => {
  const restore = [];
  const calls = { histories: [], txAudits: [], outerAudits: [] };
  const item = {
    id: 5n, studentId: 20n, titulo: "Aviso", descripcion: "Seguimiento", nivelRiesgo: "medio", estado: "en_seguimiento",
    score: 50, probabilidad: 0.5, recomendacion: null, createdAt: new Date(), updatedAt: new Date(),
    factores: [], student: { id: 20n, codigo: "E-20", nombres: "Ana", apellidos: "Sol", seccionId: null },
  };
  replace(prisma.alert, "findFirst", async () => ({ id: 5n }), restore);
  replace(prisma, "$transaction", async (callback) => callback({
    $queryRaw: async () => [],
    alert: { findUniqueOrThrow: async () => ({ estado: "nueva" }), update: async () => item },
    alertaHistorial: { create: async (args) => calls.histories.push(args) },
    auditLog: { create: async (args) => calls.txAudits.push(args) },
  }), restore);
  replace(prisma.auditLog, "create", async (args) => calls.outerAudits.push(args), restore);
  try {
    const res = response(); let error;
    await patchAlertStatus({ user: admin, params: { id: "5" }, body: { status: "en_seguimiento" }, ip: "127.0.0.1" }, res, (e) => { error = e; });
    assert.ifError(error);
    assert.deepStrictEqual(calls.histories[0].data, { alertaId: 5n, estadoAnterior: "nueva", estadoNuevo: "en_seguimiento", usuarioId: 7n });
    assert.strictEqual(calls.txAudits.length, 1);
    assert.strictEqual(calls.outerAudits.length, 1);
    assert.strictEqual(res.body.data.item.estado_label, "En seguimiento");
    assert.strictEqual(res.body.data.item.student.seccionId, null);
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("patchAlertStatus rejects an alert outside the authorized student scope", async () => {
  const restore = [];
  replace(prisma.alert, "findFirst", async () => null, restore);
  try {
    let error;
    await patchAlertStatus({ user: admin, params: { id: "5" }, body: { status: "resuelta" } }, response(), (e) => { error = e; });
    assert.strictEqual(error.statusCode, 403);
    assert.match(error.message, /fuera de su alcance/);
  } finally { restore.reverse().forEach((fn) => fn()); }
});




