import assert from "node:assert/strict";
import { after, test } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";

// Aislamiento duro: esta suite solo puede ejecutarse contra la BD desechable local.
const connection = new URL(process.env.DATABASE_URL ?? "mysql://invalid");
if (connection.hostname !== "127.0.0.1" || connection.port !== "33316" || connection.pathname !== "/blenkir_refactor_test") {
  throw new Error("Role tests require the isolated local blenkir_refactor_test database on port 33316");
}
const { prisma } = await import("../src/utils/prisma.js");
const { registerStudent } = await import("../src/services/student-registration.service.js");
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

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const json = { "Content-Type": "application/json" };

async function login(email: string, password: string) {
  const res = await fetch(base + "/auth/login", { method: "POST", headers: json, body: JSON.stringify({ email, password }) });
  if (res.status !== 200) assert.fail(`login ${email} -> ${res.status}: ${await res.text()}`);
  return (await res.json()).data as { token: string; refreshToken: string };
}
const roleOf = (token: string) => (jwt.decode(token) as { role?: string; sid?: string });
const call = (path: string, token?: string, init?: RequestInit) =>
  fetch(base + path, { ...init, headers: { ...json, ...(token ? auth(token) : {}) } });

test("FASE 4 — matriz de roles con sesiones reales sobre BD aislada", async t => {
  // ── Fixtures: cuentas ficticias exclusivas de este entorno de pruebas ──
  const [adminRole, teacherRole, studentRole] = await Promise.all(
    (["admin", "docente", "estudiante"] as const).map(codigo =>
      prisma.role.upsert({ where: { codigo }, create: { codigo, nombre: codigo }, update: {} })),
  );
  const { default: bcrypt } = await import("bcryptjs");
  const director = await prisma.user.create({ data: { rolId: adminRole.id, email: "f4-director@example.test", passwordHash: await bcrypt.hash("F4-Direct0r", 4), nombres: "Director", apellidos: "F4" } });
  const paUser = await prisma.user.create({ data: { rolId: teacherRole.id, email: "f4-prof-a@example.test", passwordHash: await bcrypt.hash("F4-Profa123", 4), nombres: "Profesor", apellidos: "A", dni: "70000011" } });
  const pbUser = await prisma.user.create({ data: { rolId: teacherRole.id, email: "f4-prof-b@example.test", passwordHash: await bcrypt.hash("F4-Profb123", 4), nombres: "Profesor", apellidos: "B", dni: "70000012" } });

  let year = await prisma.anioLectivo.findFirst({ where: { anio: 2026, activo: true } });
  if (!year) {
    const inst = await prisma.institucion.create({ data: { codigo: "TEST-ROL-26", nombre: "Institution for role tests" } });
    year = await prisma.anioLectivo.create({ data: { institucionId: inst.id, anio: 2026, nombre: "2026", activo: true, fechaInicio: new Date("2026-03-01"), fechaFin: new Date("2026-12-20") } });
  }
  let period = await prisma.periodoAcademico.findFirst({ where: { anioLectivoId: year.id, activo: true } });
  if (!period) period = await prisma.periodoAcademico.create({ data: { anioLectivoId: year.id, numero: 4, nombre: "IV", activo: true, fechaInicio: new Date("2026-09-01"), fechaFin: new Date("2026-10-31") } });

  const nivel = await prisma.nivelEducativo.create({ data: { codigo: "F4", nombre: "Nivel F4" } });
  const grado = await prisma.grado.create({ data: { nivelId: nivel.id, numero: 1, nombre: "Primero F4" } });
  const secA = await prisma.seccion.create({ data: { gradoId: grado.id, nombre: "A", capacidad: 10 } });
  const secB = await prisma.seccion.create({ data: { gradoId: grado.id, nombre: "B", capacidad: 10 } });
  const area = await prisma.areaCurricular.create({ data: { codigo: "F4", nombre: "Pruebas F4" } });
  const catA = await prisma.cursoCatalogo.create({ data: { areaId: area.id, codigo: "F4-A", nombre: "Curso F4 A" } });
  const catB = await prisma.cursoCatalogo.create({ data: { areaId: area.id, codigo: "F4-B", nombre: "Curso F4 B" } });
  const teacherA = await prisma.teacher.create({ data: { usuarioId: paUser.id, codigo: "PROF-901", nombres: "Profesor", apellidos: "A", especialidad: "Pruebas", email: paUser.email, dni: "70000011" } });
  const teacherB = await prisma.teacher.create({ data: { usuarioId: pbUser.id, codigo: "PROF-902", nombres: "Profesor", apellidos: "B", especialidad: "Pruebas", email: pbUser.email, dni: "70000012" } });
  const courseA = await prisma.course.create({ data: { cursoId: catA.id, seccionId: secA.id, profesorId: teacherA.id, anioLectivoId: year.id, codigo: "F4-2026-A" } });
  const courseB = await prisma.course.create({ data: { cursoId: catB.id, seccionId: secB.id, profesorId: teacherB.id, anioLectivoId: year.id, codigo: "F4-2026-B" } });
  await prisma.teacherCourseAssignment.create({ data: { profesorId: teacherA.id, cursoId: catA.id, seccionId: secA.id, gradoId: grado.id, anioLectivoId: year.id, cursoOfertaId: courseA.id } });
  await prisma.teacherCourseAssignment.create({ data: { profesorId: teacherB.id, cursoId: catB.id, seccionId: secB.id, gradoId: grado.id, anioLectivoId: year.id, cursoOfertaId: courseB.id } });
  const estA = await registerStudent({ dni: "90000501", nombres: "Estudiante", apellidos: "Alfa", seccionId: String(secA.id) }, String(director.id));
  const estB = await registerStudent({ dni: "90000502", nombres: "Estudiante", apellidos: "Beta", seccionId: String(secB.id) }, String(director.id));

  // Sesiones reales de los cinco roles ficticios.
  const directorS = await login("f4-director@example.test", "F4-Direct0r");
  const paS1 = await login("f4-prof-a@example.test", "F4-Profa123");
  const pbS = await login("f4-prof-b@example.test", "F4-Profb123");
  const estAS = await login(estA.credentials.email, estA.credentials.temporaryPassword);
  const estBS = await login(estB.credentials.email, estB.credentials.temporaryPassword);

  await t.test("F4.1 los cinco roles inician sesión con token y rol correctos (sid presente)", () => {
    for (const [session, expected] of [
      [directorS, "admin"], [paS1, "docente"], [pbS, "docente"], [estAS, "estudiante"], [estBS, "estudiante"],
    ] as const) {
      const payload = roleOf(session.token);
      assert.equal(payload.role, expected);
      assert.ok(payload.sid, "el access token debe llevar el claim sid de sesión (Sprint 2)");
    }
    assert.notEqual(estA.credentials.email, estB.credentials.email);
    assert.equal(studentRole.codigo, "estudiante");
  });

  await t.test("F4.2 director ejecuta acciones administrativas", async () => {
    assert.equal((await call("/students", directorS.token)).status, 200);
    assert.equal((await call("/teachers", directorS.token)).status, 200);
    const created = await call("/teachers", directorS.token, {
      method: "POST",
      body: JSON.stringify({ dni: "70000099", nombres: "Nuevo", apellidos: "Prueba", especialidad: "Pruebas", correo: "f4-creado@example.test" }),
    });
    assert.equal(created.status, 201, await created.text());
    assert.equal(await prisma.teacher.count({ where: { email: "f4-creado@example.test" } }), 1);
    assert.equal((await call(`/students/${estA.student.id}`, directorS.token)).status, 200);
  });

  await t.test("F4.3 profesor A opera solo sus cursos y estudiantes autorizados", async () => {
    assert.equal((await call(`/grades?courseId=${courseA.id}`, paS1.token)).status, 200);
    const grade = await call("/grades", paS1.token, {
      method: "POST",
      body: JSON.stringify({ studentId: String(estA.student.id), courseId: String(courseA.id), periodoId: String(period.id), nota: 15 }),
    });
    assert.equal(grade.status, 201, await grade.text());
    const list = await call(`/grades?courseId=${courseA.id}`, paS1.token);
    const items = (await list.json()).data.items as Array<{ nota: number; studentId: string }>;
    assert.ok(items.some(g => Number(g.nota) === 15 && g.studentId === String(estA.student.id)));
    const attendance = await call("/attendance", paS1.token, {
      method: "POST",
      body: JSON.stringify({ studentId: String(estA.student.id), fecha: "2026-09-16", presente: true }),
    });
    assert.equal(attendance.status, 201, await attendance.text());
    assert.equal((await call(`/students/${estA.student.id}`, paS1.token)).status, 200);
    const own = await call("/grades", paS1.token);
    assert.ok(((await own.json()).data.items as Array<{ studentId: string }>).some(g => g.studentId === String(estA.student.id)));
  });

  await t.test("F4.4 profesor B no consulta ni modifica datos de profesor A (403)", async () => {
    const write = await call("/grades", pbS.token, {
      method: "POST",
      body: JSON.stringify({ studentId: String(estA.student.id), courseId: String(courseA.id), periodoId: String(period.id), nota: 5 }),
    });
    assert.equal(write.status, 403, await write.text());
    assert.equal((await call(`/grades?courseId=${courseA.id}`, pbS.token)).status, 403);
    const att = await call("/attendance", pbS.token, {
      method: "POST",
      body: JSON.stringify({ studentId: String(estA.student.id), fecha: "2026-09-17", presente: false }),
    });
    assert.equal(att.status, 403, await att.text());
    assert.equal((await call(`/students/${estA.student.id}`, pbS.token)).status, 403);
    const list = await call("/grades", pbS.token);
    assert.equal(list.status, 200);
    const items = (await list.json()).data.items as Array<{ studentId: string }>;
    assert.ok(!items.some(g => g.studentId === String(estA.student.id)), "profesor B no debe ver notas de estudiantes ajenos");
    assert.equal((await call(`/students/${estB.student.id}`, pbS.token)).status, 200);
  });

  await t.test("F4.5 estudiante A no consulta datos privados de estudiante B (403)", async () => {
    assert.equal((await call("/estudiante/perfil", estAS.token)).status, 200);
    assert.equal((await call("/estudiante/perfil", estBS.token)).status, 200);
    assert.equal((await call(`/students/${estB.student.id}`, estAS.token)).status, 403);
    assert.equal((await call(`/students/${estA.student.id}`, estAS.token)).status, 200);
    assert.equal((await call(`/students/${estA.student.id}`, estBS.token)).status, 403);
  });

  await t.test("F4.6 sin sesión: 401 en recursos protegidos", async () => {
    assert.equal((await call("/students")).status, 401);
    assert.equal((await call("/grades")).status, 401);
    assert.equal((await call("/estudiante/perfil")).status, 401);
    assert.equal((await call("/auth/me")).status, 401);
  });

  await t.test("F4.7 token expirado: 401", async () => {
    const expired = jwt.sign({ sub: String(paUser.id), role: "docente", email: paUser.email }, process.env.JWT_SECRET!, { expiresIn: -10 });
    assert.equal((await call("/auth/me", expired)).status, 401);
    assert.equal((await call("/grades", expired)).status, 401);
  });

  await t.test("F4.8 token revocado por logout: 401 y la sesión paralela persiste", async () => {
    const paS2 = await login("f4-prof-a@example.test", "F4-Profa123");
    assert.notEqual(roleOf(paS1.token).sid, roleOf(paS2.token).sid);
    const out = await call("/auth/logout", paS1.token, { method: "POST", body: JSON.stringify({ refreshToken: paS1.refreshToken }) });
    assert.equal(out.status, 200, await out.text());
    assert.equal((await call("/auth/me", paS1.token)).status, 401, "token de sesión revocada debe quedar inválido");
    assert.equal((await call("/auth/me", paS2.token)).status, 200, "la otra sesión activa no debe verse afectada");
    const reuse = await call("/auth/refresh", undefined, { method: "POST", body: JSON.stringify({ refreshToken: paS1.refreshToken }) });
    assert.equal(reuse.status, 401, "el refresh de la sesión revocada debe rechazarse");
    const out2 = await call("/auth/logout", paS2.token, { method: "POST", body: JSON.stringify({ refreshToken: paS2.refreshToken }) });
    assert.equal(out2.status, 200, await out2.text());
    assert.equal((await call("/auth/me", paS2.token)).status, 401);
  });

  await t.test("F4.9 puertas de rol: 403 según el contrato", async () => {
    // F4.8 revocó las sesiones previas del profesor A: se usa una sesión nueva,
    // de modo que cualquier 401 aquí sí indicaría un defecto de autenticación.
    const paFresh = await login("f4-prof-a@example.test", "F4-Profa123");
    assert.equal((await call("/students", estAS.token)).status, 403);
    assert.equal((await call("/grades", estAS.token)).status, 403);
    assert.equal((await call("/predictions", estAS.token)).status, 403);
    assert.equal((await call("/teachers", estAS.token)).status, 403);
    assert.equal((await call("/students", paFresh.token)).status, 403);
    assert.equal((await call("/teachers", paFresh.token)).status, 403);
    assert.equal((await call("/estudiante/perfil", paFresh.token)).status, 403);
    const grade = await call("/grades", estAS.token, {
      method: "POST",
      body: JSON.stringify({ studentId: String(estA.student.id), courseId: String(courseA.id), periodoId: String(period.id), nota: 20 }),
    });
    assert.equal(grade.status, 403, await grade.text());
  });
});
