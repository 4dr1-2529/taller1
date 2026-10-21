import assert from "node:assert/strict";
import { after, test } from "node:test";
import express from "express";

// Aislamiento duro: esta suite solo puede ejecutarse contra la BD desechable local.
const connection = new URL(process.env.DATABASE_URL ?? "mysql://invalid");
if (connection.hostname !== "127.0.0.1" || connection.port !== "33316" || connection.pathname !== "/blenkir_refactor_test") {
  throw new Error("Rate limit tests require the isolated local blenkir_refactor_test database on port 33316");
}

// Caps reducidos SOLO en este proceso de prueba (los defaults seguros de
// producción viven en src/config/env.ts). dotenv no pisa variables ya
// definidas, así que esto se fija antes de cargar la configuración.
process.env.RATE_LIMIT_MAX = "60";
process.env.AUTH_RATE_LIMIT_MAX = "12";
process.env.RATE_LIMIT_WINDOW_MS = String(15 * 60 * 1000);

const { prisma } = await import("../src/utils/prisma.js");
const { createGlobalLimiter, createAuthLimiter } = await import("../src/middleware/rateLimit.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");

// Fixture: cuenta ficticia exclusiva de este entorno de pruebas.
const { default: bcrypt } = await import("bcryptjs");
const adminRole = await prisma.role.upsert({ where: { codigo: "admin" }, create: { codigo: "admin", nombre: "admin" }, update: {} });
const email = "ratelimit-admin@example.test";
// email no tiene @unique en el esquema (la unicidad la impone el servicio):
// limpiar cualquier residuo de corridas previas con deleteMany.
await prisma.user.deleteMany({ where: { email } });
const user = await prisma.user.create({
  data: { rolId: adminRole.id, email, passwordHash: await bcrypt.hash("Rl-Admin123", 4), nombres: "Rate", apellidos: "Limit" },
});
after(async () => {
  await prisma.user.deleteMany({ where: { email } }).catch(() => undefined);
  await prisma.$disconnect();
});

/**
 * Misma composición de limitadores que src/index.ts (auth en rutas sensibles
 * antes del backstop global), montada en un servidor efímero por test para
 * aislar buckets (cada createAppSync() crea instancias nuevas con store propio).
 */
const { default: router } = await import("../src/routes/index.js");

function createAppSync() {
  const app = express();
  app.disable("x-powered-by");
  app.set("json replacer", (_key: string, value: unknown) => typeof value === "bigint" ? String(value) : value);
  app.use(express.json());
  const authLimiter = createAuthLimiter();
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/refresh", authLimiter);
  app.use("/api/v1/auth/change-password", authLimiter);
  app.use("/api/v1", createGlobalLimiter(), router);
  app.use(errorHandler);
  return app;
}

async function listen(app: ReturnType<typeof createAppSync>) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  const base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
  return { server, base };
}

const json = { "Content-Type": "application/json" };
async function login(base: string, headers: Record<string, string> = {}) {
  const res = await fetch(base + "/api/v1/auth/login", {
    method: "POST",
    headers: { ...json, ...headers },
    body: JSON.stringify({ email, password: "Rl-Admin123" }),
  });
  return { status: res.status, body: await res.json() as { success?: boolean; errors?: string[] } };
}
const get = (base: string, path: string, token?: string) =>
  fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

test("T1 — operaciones normales: login + 40 listados autenticados sin 429", async (t) => {
  const { server, base } = await listen(createAppSync());
  t.after(() => server.close());

  const session = await login(base);
  assert.equal(session.status, 200, "el login debe funcionar bajo el nuevo limite de auth");
  const token = (session.body as unknown as { data: { token: string } }).data.token;

  for (let i = 1; i <= 40; i++) {
    const res = await get(base, "/api/v1/students?page=1&limit=20", token);
    assert.equal(res.status, 200, `la operacion ordinaria #${i} no debe recibir 429`);
  }
});

test("T2 — abuso de autenticacion: 429 en login, listado sigue funcionando", async (t) => {
  const { server, base } = await listen(createAppSync());
  t.after(() => server.close());

  const ok = await login(base);
  assert.equal(ok.status, 200);
  const token = (ok.body as unknown as { data: { token: string } }).data.token;

  // AUTH_RATE_LIMIT_MAX=12: los primeros 11 logins adicionales pasan (12 en
  // total con el del arranque) y el resto debe quedar rechazado con 429.
  const statuses: number[] = [];
  for (let i = 1; i <= 15; i++) statuses.push((await login(base)).status);
  assert.deepEqual(statuses.slice(0, 11), Array(11).fill(200), "los primeros logins dentro del limite pasan");
  assert.deepEqual(statuses.slice(11), Array(4).fill(429), "los logins excedidos reciben 429");

  const abuse = await login(base);
  assert.equal(abuse.status, 429);
  assert.deepEqual(abuse.body.errors, ["RATE_LIMIT"], "el 429 de auth conserva el cuerpo RATE_LIMIT");

  // El bucket de auth es independiente: un listado ordinario autenticado
  // sigue respondiendo 200 tras agotar el limite de login.
  const list = await get(base, "/api/v1/students?page=1&limit=20", token);
  assert.equal(list.status, 200, "el listado no debe verse afectado por el agotamiento del bucket de auth");
});

test("T3 — abuso global: 429 solo al superar el presupuesto amplio de la IP", async (t) => {
  const { server, base } = await listen(createAppSync());
  t.after(() => server.close());

  const ok = await login(base);
  assert.equal(ok.status, 200);
  const token = (ok.body as unknown as { data: { token: string } }).data.token;

  // RATE_LIMIT_MAX=60 y el login ya consumo 1: quedan 59 peticiones.
  const statuses: number[] = [];
  for (let i = 1; i <= 70; i++) {
    statuses.push((await get(base, "/api/v1/students?page=1&limit=20", token)).status);
  }
  assert.deepEqual(statuses.slice(0, 59), Array(59).fill(200), "las 59 restantes del presupuesto pasan");
  assert.deepEqual(statuses.slice(59), Array(11).fill(429), "a partir del limite global llega 429");

  const abuse = await get(base, "/api/v1/students", token);
  assert.equal(abuse.status, 429);
  assert.deepEqual((await abuse.json() as { errors?: string[] }).errors, ["RATE_LIMIT"]);
});

test("T4 — X-Forwarded-For falsificado no crea un bucket nuevo (anti-spoofing)", async (t) => {
  const { server, base } = await listen(createAppSync());
  t.after(() => server.close());

  // Agota el bucket de auth de esta app…
  const statuses: number[] = [];
  for (let i = 1; i <= 13; i++) statuses.push((await login(base)).status);
  assert.deepEqual(statuses.slice(12), [429], "el bucket de auth quedo agotado");

  // …y una cabecera X-Forwarded-For manipulada NO debe sortearlo: fuera de
  // producción trust proxy esta deshabilitado (CONF-02) y req.ip ignora la
  // cabecera; en produccion la clave es X-Real-IP definido por el edge.
  const spoofed = await login(base, { "X-Forwarded-For": "203.0.113.99" });
  assert.equal(spoofed.status, 429, "la IP falsificada no debe obtener un bucket nuevo");
});
