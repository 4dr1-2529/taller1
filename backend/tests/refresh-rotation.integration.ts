import assert from "node:assert/strict";
import { after, test } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";

// Aislamiento duro: esta suite solo puede ejecutarse contra la BD desechable local.
const connection = new URL(process.env.DATABASE_URL ?? "mysql://invalid");
if (connection.hostname !== "127.0.0.1" || connection.port !== "33316" || connection.pathname !== "/blenkir_refactor_test") {
  throw new Error("Refresh rotation tests require the isolated local blenkir_refactor_test database on port 33316");
}
// SPRINT 5 — ventana de gracia corta para poder ejercitar el peor caso
// (reutilización FUERA de gracia) sin esperas largas. Debe fijarse ANTES de
// importar env.ts/rutas.
process.env.REFRESH_REUSE_GRACE_MS = process.env.REFRESH_REUSE_GRACE_MS ?? "1000";
const GRACE_MS = Number(process.env.REFRESH_REUSE_GRACE_MS);

const { prisma } = await import("../src/utils/prisma.js");
const { env } = await import("../src/config/env.js");
const { hashToken } = await import("../src/utils/tokens.js");
const { default: router } = await import("../src/routes/index.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");

const app = express();
app.disable("x-powered-by");
app.set("json replacer", (_key: string, value: unknown) => typeof value === "bigint" ? String(value) : value);
app.use(express.json());
app.use(router);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
await new Promise<void>(resolve => server.once("listening", resolve));
const address = server.address();
const base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
after(async () => { server.close(); await prisma.$disconnect(); });

const json = { "Content-Type": "application/json" };
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const call = (path: string, token?: string, init?: RequestInit) =>
  fetch(base + path, { ...init, headers: { ...json, ...(token ? auth(token) : {}) } });

type AuthData = { token: string; refreshToken: string };

async function post(path: string, body: unknown, token?: string) {
  const res = await call(path, token, { method: "POST", body: JSON.stringify(body) });
  const payload = res.status === 204 ? null : (await res.json().catch(() => null)) as { data?: Record<string, unknown>; message?: string } | null;
  return { status: res.status, body: payload };
}

async function login(email: string, password: string): Promise<AuthData> {
  const { status, body } = await post("/auth/login", { email, password });
  if (status !== 200) assert.fail(`login ${email} -> ${status}: ${JSON.stringify(body)}`);
  return body!.data as unknown as AuthData;
}

const sidOf = (accessToken: string) => (jwt.decode(accessToken) as { sid?: string }).sid;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test("SPRINT 5 — rotación segura de refresh tokens sobre BD aislada", async t => {
  const { default: bcrypt } = await import("bcryptjs");
  const role = await prisma.role.upsert({ where: { codigo: "admin" }, create: { codigo: "admin", nombre: "admin" }, update: {} });
  const mkUser = async (tag: string, password: string) => {
    const email = `s5-rot-${tag}@example.test`;
    await prisma.user.deleteMany({ where: { email } });
    return prisma.user.create({
      data: { rolId: role.id, email, passwordHash: await bcrypt.hash(password, 4), nombres: "S5", apellidos: tag },
    });
  };
  const pwd1 = process.env.S5_ROT_PWD1;
  const pwd2 = process.env.S5_ROT_PWD2;
  const pwd3 = process.env.S5_ROT_PWD3;
  if (!pwd1 || !pwd2 || !pwd3) {
    throw new Error(
      "Faltan variables de entorno S5_ROT_PWD1/S5_ROT_PWD2/S5_ROT_PWD3 para las pruebas de rotación de refresh tokens.",
    );
  }
  const u1 = await mkUser("u1", pwd1);
  const u2 = await mkUser("u2", pwd2);
  const u3 = await mkUser("u3", pwd3);
  const pwd = pwd1;

  await t.test("login incorrecto no crea sesión y el correcto emite refresh vigente", async () => {
    const bad = await post("/auth/login", { email: u1.email, password: "ClaveMala1" });
    assert.equal(bad.status, 401);
    const sessions = await prisma.session.count({ where: { usuarioId: u1.id } });
    assert.equal(sessions, 0, "un login fallido no debe crear sesion");

    const a = await login(u1.email, pwd);
    assert.ok(a.token && a.refreshToken);
    const sid = sidOf(a.token);
    assert.ok(sid, "el access token debe llevar el claim sid");
    const row = await prisma.session.findUnique({ where: { id: BigInt(sid!) } });
    assert.equal(row?.tokenHash, hashToken(a.refreshToken), "token_hash debe guardar el hash del refresh vigente");
    assert.equal(row?.refreshHash, null, "sin rotacion previa no hay refresh_hash anterior");
    assert.ok(row?.refreshExpires, "refresh_expires debe documentar el TTL del refresh");
  });

  await t.test("refresh válido rota: emite access+refresh nuevos y el anterior queda invalidado", async () => {
    const a = await login(u1.email, pwd);
    const r = await post("/auth/refresh", { refreshToken: a.refreshToken });
    assert.equal(r.status, 200);
    const data = r.body!.data as unknown as AuthData;
    assert.ok(data.token && data.refreshToken, "la renovacion debe devolver access + refresh");
    assert.notEqual(data.refreshToken, a.refreshToken, "el refresh nuevo debe ser distinto del anterior");
    assert.equal((await call("/auth/me", data.token)).status, 200, "el access renovado debe ser valido");
    assert.equal(sidOf(data.token), sidOf(a.token), "la rotacion conserva la misma sesion (sid)");

    const row = await prisma.session.findUnique({ where: { id: BigInt(sidOf(a.token)!) } });
    assert.equal(row?.tokenHash, hashToken(data.refreshToken), "token_hash pasa al refresh nuevo");
    assert.equal(row?.refreshHash, hashToken(a.refreshToken), "refresh_hash conserva el anterior (para deteccion)");
    assert.ok(row?.refreshRotatedAt, "refresh_rotated_at queda registrado");

    const replay = await post("/auth/refresh", { refreshToken: a.refreshToken });
    assert.equal(replay.status, 401, "el refresh anterior debe rechazarse de inmediato");
    assert.ok(replay.body?.message?.includes("ya renovado"), `mensaje esperado de carrera, obtuvo: ${replay.body?.message}`);
    const alive = await post("/auth/refresh", { refreshToken: data.refreshToken });
    assert.equal(alive.status, 200, "el 401 por carrera NO debe revocar la sesion");
    await prisma.session.deleteMany({ where: { usuarioId: u1.id } });
  });

  await t.test("reutilización fuera de la ventana de gracia revoca la sesión con auditoría", async () => {
    const a = await login(u1.email, pwd);
    const rotated = await post("/auth/refresh", { refreshToken: a.refreshToken });
    assert.equal(rotated.status, 200);
    const data = rotated.body!.data as unknown as AuthData;

    await sleep(GRACE_MS + 600);
    const replay = await post("/auth/refresh", { refreshToken: a.refreshToken });
    assert.equal(replay.status, 401);
    assert.ok(replay.body?.message?.includes("Reutilización"), `mensaje de deteccion esperado, obtuvo: ${replay.body?.message}`);

    assert.equal((await post("/auth/refresh", { refreshToken: data.refreshToken })).status, 401, "la sesion comprometida queda revocada");
    assert.equal((await call("/auth/me", data.token)).status, 401, "el access de la sesion revocada queda invalido de inmediato");

    const audit = await prisma.auditLog.findFirst({
      where: { usuarioId: u1.id, accion: "REFRESH_REUSE_DETECTED" },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(audit, "debe quedar un evento de auditoría REFRESH_REUSE_DETECTED");
  });

  await t.test("renovaciones concurrentes: solo una gana y la sesión no se revoca", async () => {
    const a = await login(u1.email, pwd);
    const [r1, r2] = await Promise.all([
      post("/auth/refresh", { refreshToken: a.refreshToken }),
      post("/auth/refresh", { refreshToken: a.refreshToken }),
    ]);
    const statuses = [r1.status, r2.status].sort((a: number, b: number) => a - b);
    assert.deepEqual(statuses, [200, 401], `exactamente una renovacion debe ganar, obtuvo ${statuses}`);
    const winner = (r1.status === 200 ? r1 : r2).body!.data as unknown as AuthData;
    // El ganador usa SU refresh (r1) una sola vez → r2.
    const alive = await post("/auth/refresh", { refreshToken: winner.refreshToken });
    assert.equal(alive.status, 200, "la sesion debe seguir viva tras la carrera (gracia)");
    const winnerData = alive.body!.data as unknown as AuthData;
    const replay = await post("/auth/refresh", { refreshToken: a.refreshToken });
    assert.equal(replay.status, 401, "el token de la carrera perdida sigue rechazado");
    assert.equal((await post("/auth/refresh", { refreshToken: winnerData.refreshToken })).status, 200, "la cadena del ganador sigue vigente (r2)");
    await prisma.session.deleteMany({ where: { usuarioId: u1.id } });
  });

  await t.test("varias sesiones: revocar una por reutilización no toca a las demás ni a otros usuarios", async () => {
    const sA = await login(u1.email, pwd);
    const sB = await login(u1.email, pwd);
    const other = await login(u2.email, pwd2);

    const rotA = await post("/auth/refresh", { refreshToken: sA.refreshToken });
    assert.equal(rotA.status, 200);
    await sleep(GRACE_MS + 600);
    assert.equal((await post("/auth/refresh", { refreshToken: sA.refreshToken })).status, 401, "reutilizacion tardia -> sesion A revocada");

    const rb = await post("/auth/refresh", { refreshToken: sB.refreshToken });
    assert.equal(rb.status, 200, "la sesion B del MISMO usuario debe quedar intacta");
    assert.equal((await post("/auth/refresh", { refreshToken: other.refreshToken })).status, 200, "las sesiones de OTROS usuarios no se tocan");
    await prisma.session.deleteMany({ where: { usuarioId: { in: [u1.id, u2.id] } } });
  });

  await t.test("logout y cambio de contraseña conservan su semántica con rotación", async () => {
    const a = await login(u1.email, pwd);
    const out = await post("/auth/logout", { refreshToken: a.refreshToken }, a.token);
    assert.equal(out.status, 200);
    assert.equal((await post("/auth/refresh", { refreshToken: a.refreshToken })).status, 401, "tras logout el refresh no renueva");
    assert.equal((await call("/auth/me", a.token)).status, 401, "tras logout el access queda invalido (sid revocado)");

    // Dos sesiones; el cambio de contraseña revoca la otra y conserva la actual.
    const cur = await login(u1.email, pwd);
    const otherDev = await login(u1.email, pwd);
    const rotatedCur = await post("/auth/refresh", { refreshToken: cur.refreshToken });
    assert.equal(rotatedCur.status, 200);
    const curData = rotatedCur.body!.data as unknown as AuthData;
    const chg = await post("/auth/change-password", { currentPassword: pwd, newPassword: pwd2 }, curData.token);
    assert.equal(chg.status, 200);
    assert.equal((await post("/auth/refresh", { refreshToken: otherDev.refreshToken })).status, 401, "la otra sesion queda revocada");
    assert.equal((await post("/auth/refresh", { refreshToken: curData.refreshToken })).status, 200, "la sesion actual (rotada) se conserva");
    await login(u1.email, pwd2); // re-login con la clave nueva
    await prisma.session.deleteMany({ where: { usuarioId: u1.id } });
  });

  await t.test("access token expirado o firmado con otro propósito se rechaza", async () => {
    const a = await login(u3.email, "S5-Rotacion3");
    const expired = jwt.sign(
      { sub: String(u3.id), email: u3.email, role: "admin", sid: sidOf(a.token) },
      env.JWT_SECRET,
      { expiresIn: -10 },
    );
    assert.equal((await call("/auth/me", expired)).status, 401, "access expirado debe rechazarse");
    const wrongType = jwt.sign({ sub: String(u3.id), type: "refresh" }, env.JWT_SECRET, { expiresIn: "5m" });
    const r = await post("/auth/refresh", { refreshToken: wrongType });
    assert.equal(r.status, 401, "un JWT que no es refresh no renueva");
    const forgedSid = jwt.sign(
      { sub: String(u2.id), email: u2.email, role: "admin", sid: sidOf(a.token) },
      env.JWT_SECRET,
      { expiresIn: "5m" },
    );
    assert.equal((await call("/auth/me", forgedSid)).status, 401, "un access firmado (sesion ajena revocada/viva) no debe cruzar sesiones");
    await prisma.session.deleteMany({ where: { usuarioId: { in: [u1.id, u2.id, u3.id] } } });
  });
});
