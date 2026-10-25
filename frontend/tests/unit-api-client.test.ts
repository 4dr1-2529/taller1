import test from "node:test";
import assert from "node:assert/strict";

// Configurar variable de entorno antes de importar
process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1";

// Mock de fetch antes de importar api.ts
const mockFetchResponses: Record<string, { status: number; body: any }> = {};
globalThis.fetch = async (url: string | Request, _init?: RequestInit) => {
  const urlStr = typeof url === "string" ? url : url.url;
  const key = Object.keys(mockFetchResponses).find((k) => urlStr.includes(k));
  if (key) {
    const resp = mockFetchResponses[key];
    const body = { ...resp.body, total: resp.body.total ?? 0 };
    return {
      status: resp.status,
      ok: resp.status >= 200 && resp.status < 300,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as Response;
  }
  return {
    status: 404,
    ok: false,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({ error: "not found" }),
  } as Response;
};

import { api } from "../src/services/api.js";

test("api.login envía credenciales y devuelve token", async () => {
  mockFetchResponses["/auth/login"] = {
    status: 200,
    body: { token: "tok123", refreshToken: "ref123", user: { id: "1", email: "a@b.com", nombres: "Juan", apellidos: "P", role: "estudiante", teacherId: null } },
  };
  const res = await api.login("a@b.com", "pass123");
  assert.strictEqual(res.token, "tok123");
  assert.strictEqual(res.refreshToken, "ref123");
  assert.strictEqual(res.user.email, "a@b.com");
});

test("api.login lanza error en 401", async () => {
  mockFetchResponses["/auth/login"] = { status: 401, body: { message: "Credenciales incorrectas" } };
  await assert.rejects(() => api.login("a@b.com", "wrong"));
});

test("api.refreshToken renueva sesión", async () => {
  mockFetchResponses["/auth/refresh"] = { status: 200, body: { token: "newtok", refreshToken: "newref" } };
  const res = await api.refreshToken("oldref");
  assert.strictEqual(res.token, "newtok");
  assert.strictEqual(res.refreshToken, "newref");
});

test("api.getStudents devuelve lista", async () => {
  mockFetchResponses["/students"] = { status: 200, body: { items: [{ id: "1", codigo: "E1", nombres: "A", apellidos: "B", nivel: "1°", correo: "a@b.com", telefono: null, estado: "activo", promedioGeneral: 15, asistenciaGeneral: 90, lmsEngagement: "alto", activo: true, createdAt: "2026-01-01", updatedAt: "2026-01-01", lmsActividades: [], predictions: [], alerts: [] }], total: 1, page: 1, pages: 1 } };
  const res = await api.getStudents();
  assert.strictEqual(res.total, 1);
  assert.strictEqual(res.items.length, 1);
});

test("api.getTeachers devuelve lista", async () => {
  mockFetchResponses["/teachers"] = { status: 200, body: { items: [{ id: "t1", codigo: "T1", nombres: "Ana", apellidos: "G", especialidad: "Mat", correo: "ana@t.com", telefono: null, activo: true }], total: 1 } };
  const res = await api.getTeachers();
  assert.strictEqual(res.total, 1);
});

test("api.getCourses devuelve lista", async () => {
  mockFetchResponses["/courses"] = { status: 200, body: { items: [{ id: "c1", codigo: "M1", nombre: "Matemáticas", nivel: "1°", profesorId: "t1", activo: true }], total: 1 } };
  const res = await api.getCourses();
  assert.strictEqual(res.total, 1);
});

test("api.getGrades devuelve lista", async () => {
  mockFetchResponses["/grades"] = { status: 200, body: { items: [], total: 0, page: 1, pages: 1 } };
  const res = await api.getGrades();
  assert.strictEqual(res.total, 0);
});

test("api.getAttendance devuelve lista", async () => {
  mockFetchResponses["/attendance"] = { status: 200, body: { items: [], total: 0, page: 1, pages: 1 } };
  const res = await api.getAttendance();
  assert.strictEqual(res.total, 0);
});

test("api.getMatriculas devuelve lista", async () => {
  mockFetchResponses["/matriculas"] = { status: 200, body: { items: [], total: 0, page: 1, pages: 1, activas: 0 } };
  const res = await api.getMatriculas();
  assert.strictEqual(res.total, 0);
});

test("api.getAlerts devuelve lista", async () => {
  mockFetchResponses["/alerts"] = { status: 200, body: { items: [], total: 0 } };
  const res = await api.getAlerts();
  assert.strictEqual(res.total, 0);
});

test("api.getDashboardKpis devuelve KPIs", async () => {
  mockFetchResponses["/dashboard/kpis"] = { status: 200, body: { kpis: { totalStudents: 10, openAlerts: 2, avgRisk: 30 }, riskTrend: [], riskBySection: [], alertsBySalonShort: [] } };
  const res = await api.getDashboardKpis();
  assert.strictEqual(res.kpis.totalStudents, 10);
  assert.strictEqual(res.kpis.openAlerts, 2);
});

test("api.predict envía studentId y métricas", async () => {
  mockFetchResponses["/predict"] = { status: 200, body: { prediction: { nivelRiesgo: "bajo", probabilidad: 0.2, modelName: "M1", factors: [], recommendation: "OK", predictedAt: "2026-01-01" }, source: "ml_model" } };
  const res = await api.predict("s1", { promedio_general: 15 });
  assert.strictEqual(res.prediction.nivelRiesgo, "bajo");
  assert.strictEqual(res.source, "ml_model");
});

test("api.getPredictions devuelve historial", async () => {
  mockFetchResponses["/predictions"] = { status: 200, body: { items: [], total: 0, page: 1, pages: 1 } };
  const res = await api.getPredictions();
  assert.strictEqual(res.total, 0);
});

test("api.getMlMetrics devuelve métricas", async () => {
  mockFetchResponses["/ml/metrics"] = { status: 200, body: { metrics: { accuracy: 0.85 } } };
  const res = await api.getMlMetrics();
  assert.strictEqual(res.metrics.accuracy, 0.85);
});

test("api.getMessageRooms devuelve salas", async () => {
  mockFetchResponses["/messages/rooms"] = { status: 200, body: { rooms: [] } };
  const res = await api.getMessageRooms();
  assert.strictEqual(res.rooms.length, 0);
});

test("api.getNotifications devuelve notificaciones", async () => {
  mockFetchResponses["/notifications"] = { status: 200, body: { items: [] } };
  const res = await api.getNotifications();
  assert.strictEqual(res.items.length, 0);
});

test("api.getAuditLogs devuelve auditoría", async () => {
  mockFetchResponses["/admin/audit-logs"] = { status: 200, body: { items: [], pagination: { page: 1, limit: 50, total: 0, pages: 1 } } };
  const res = await api.getAuditLogs();
  assert.strictEqual(res.total, 0);
});

test("api.getSystemStats devuelve stats", async () => {
  mockFetchResponses["/admin/system-stats"] = { status: 200, body: { stats: { totalUsers: 5 } } };
  const res = await api.getSystemStats();
  assert.strictEqual(res.stats.totalUsers, 5);
});

test("api.getUsers devuelve usuarios", async () => {
  mockFetchResponses["/admin/users"] = { status: 200, body: { items: [], total: 0 } };
  const res = await api.getUsers();
  assert.strictEqual(res.total, 0);
});

test("api.health devuelve estado", async () => {
  mockFetchResponses["/health"] = { status: 200, body: { service: "tesis-api", version: "2.0.0" } };
  const res = await api.health();
  assert.strictEqual(res.service, "tesis-api");
});
