import assert from "node:assert/strict";
import { after, test } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";

const connection = new URL(process.env.DATABASE_URL ?? "mysql://invalid");
if (connection.hostname !== "127.0.0.1" || connection.port !== "33316" || connection.pathname !== "/blenkir_refactor_test") {
  throw new Error("Integration tests require the isolated local blenkir_refactor_test database on port 33316");
}
const { prisma } = await import("../src/utils/prisma.js");
const { registerStudent } = await import("../src/services/student-registration.service.js");
const { default: router } = await import("../src/routes/index.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const { recordLmsEvent, studentIndicators } = await import("../src/services/lms.service.js");

const app = express();
app.set("json replacer", (_key: string, value: unknown) => typeof value === "bigint" ? String(value) : value);
app.use(express.json());
app.use(router);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
await new Promise<void>(resolve => server.once("listening", resolve));
const address = server.address();
const base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
after(async () => { server.close(); await prisma.$disconnect(); });

test("2026 registration, concurrency, rollback, scopes, messages and learning", async t => {
  const roles = await Promise.all((["admin", "docente", "estudiante"] as const).map(codigo => prisma.role.upsert({ where: { codigo }, create: { codigo, nombre: codigo }, update: {} })));
  const inst = await prisma.institucion.create({ data: { codigo: "TEST-2026", nombre: "Institution for automated tests" } });
  const year = await prisma.anioLectivo.create({ data: { institucionId: inst.id, anio: 2026, nombre: "2026", activo: true, fechaInicio: new Date("2026-03-01"), fechaFin: new Date("2026-12-20") } });
  const period = await prisma.periodoAcademico.create({ data: { anioLectivoId: year.id, numero: 1, nombre: "I", activo: true, fechaInicio: new Date("2026-03-01"), fechaFin: new Date("2026-05-31") } });
  const level = await prisma.nivelEducativo.create({ data: { codigo: "TEST", nombre: "Primaria test" } });
  const grade = await prisma.grado.create({ data: { nivelId: level.id, numero: 1, nombre: "Primero" } });
  const section = await prisma.seccion.create({ data: { gradoId: grade.id, nombre: "A", capacidad: 10 } });
  const outside = await prisma.seccion.create({ data: { gradoId: grade.id, nombre: "B", capacidad: 10 } });
  const full = await prisma.seccion.create({ data: { gradoId: grade.id, nombre: "C", capacidad: 0 } });
  const admin = await prisma.user.create({ data: { rolId: roles[0].id, email: "test-director@example.test", passwordHash: "unused", nombres: "Director", apellidos: "Prueba" } });
  const teacherUser = await prisma.user.create({ data: { rolId: roles[1].id, email: "test-teacher@example.test", passwordHash: "unused", nombres: "Profesor", apellidos: "Prueba" } });
  const teacher = await prisma.teacher.create({ data: { usuarioId: teacherUser.id, codigo: "PROF-001", nombres: "Profesor", apellidos: "Prueba", especialidad: "Matematica", email: teacherUser.email } });
  const area = await prisma.areaCurricular.create({ data: { codigo: "TEST", nombre: "Test" } });
  const catalog = await prisma.cursoCatalogo.create({ data: { areaId: area.id, codigo: "TEST", nombre: "Matematica" } });
  const course = await prisma.course.create({ data: { cursoId: catalog.id, seccionId: section.id, profesorId: teacher.id, anioLectivoId: year.id, codigo: "TEST-2026-A" } });
  await prisma.teacherCourseAssignment.create({ data: { profesorId: teacher.id, cursoId: catalog.id, seccionId: section.id, gradoId: grade.id, anioLectivoId: year.id, cursoOfertaId: course.id } });
  const teacherBUser = await prisma.user.create({ data: { rolId: roles[1].id, email: "test-teacher-b@example.test", passwordHash: "unused", nombres: "Profesora", apellidos: "Prueba B" } });
  const teacherB = await prisma.teacher.create({ data: { usuarioId: teacherBUser.id, codigo: "PROF-002", nombres: "Profesora", apellidos: "Prueba B", especialidad: "Comunicacion", email: teacherBUser.email } });
  const catalogB = await prisma.cursoCatalogo.create({ data: { areaId: area.id, codigo: "TEST-COM", nombre: "Comunicacion" } });
  const courseB = await prisma.course.create({ data: { cursoId: catalogB.id, seccionId: section.id, profesorId: teacherB.id, anioLectivoId: year.id, codigo: "TEST-2026-B" } });
  await prisma.teacherCourseAssignment.create({ data: { profesorId: teacherB.id, cursoId: catalogB.id, seccionId: section.id, gradoId: grade.id, anioLectivoId: year.id, cursoOfertaId: courseB.id } });
  const old = await prisma.student.create({ data: { codigo: "EST-050", nombres: "Antiguo", apellidos: "Prueba", fechaIngreso: new Date(), seccionId: section.id } });
  await prisma.student.create({ data: { codigo: "EST-200", nombres: "Limite", apellidos: "Prueba", fechaIngreso: new Date(), seccionId: section.id } });
  const input = (dni: string, seccionId = section.id) => ({ dni, nombres: "Alumno", apellidos: "Prueba", seccionId: String(seccionId) });
  const first = await registerStudent(input("90000201"), String(admin.id));
  const token = (id: bigint, role: string) => jwt.sign({ sub: String(id), role, email: "test@example.test" }, process.env.JWT_SECRET!, { expiresIn: "5m" });
  const tokens = { admin: token(admin.id, "admin"), teacher: token(teacherUser.id, "docente"), teacherB: token(teacherBUser.id, "docente"), student: token(first.student.usuarioId!, "estudiante") };
  async function call(path: string, who: keyof typeof tokens, body?: unknown, method = body ? "POST" : "GET") {
    return fetch(base + path, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens[who]}` }, body: body ? JSON.stringify(body) : undefined });
  }
  await t.test("EST-200 → EST-201; deactivate EST-050 → EST-202", async () => {
    assert.equal(first.student.codigo, "EST-201");
    assert.equal(first.student.email, "est201@blenkir.edu.pe");
    assert.ok(await prisma.enrollment.findFirst({ where: { studentId: first.student.id, cursoOfertaId: course.id } }));
    assert.equal(await prisma.matricula.count({ where: { estudianteId: first.student.id, anioLectivoId: year.id } }), 1);
    assert.equal((await call(`/students/${old.id}`, "admin", undefined, "DELETE")).status, 200);
    const second = await registerStudent(input("90000202"), String(admin.id));
    assert.equal(second.student.codigo, "EST-202");
  });
  await t.test("failed enrollment rolls back user, student, audit and counter", async () => {
    const counts = await Promise.all([prisma.user.count(), prisma.student.count(), prisma.auditLog.count()]);
    const counter = await prisma.correlativo.findUniqueOrThrow({ where: { entidad: "estudiante" } });
    await assert.rejects(registerStudent(input("90000203", full.id), String(admin.id)), /capacidad/);
    assert.deepEqual(await Promise.all([prisma.user.count(), prisma.student.count(), prisma.auditLog.count()]), counts);
    assert.equal((await prisma.correlativo.findUniqueOrThrow({ where: { entidad: "estudiante" } })).ultimoNumero, counter.ultimoNumero);
  });
  await t.test("concurrent admissions generate distinct codes", async () => {
    const results = await Promise.all([registerStudent(input("90000204"), String(admin.id)), registerStudent(input("90000205"), String(admin.id))]);
    assert.equal(new Set(results.map(r => r.student.codigo)).size, 2);
  });
  const other = await registerStudent(input("90000206", outside.id), String(admin.id));
  await t.test("student cannot read other student; professor cannot read outside scope", async () => {
    assert.equal((await call(`/students/${other.student.id}`, "student")).status, 403);
    assert.equal((await call(`/students/${other.student.id}`, "teacher")).status, 403);
    assert.equal((await call(`/students/${first.student.id}`, "student")).status, 200);
  });
  await t.test("direct-message matrix, including forged room IDs", async () => {
    for (const [who, id, expected] of [["admin", first.student.usuarioId!,403], ["student",admin.id,403], ["teacher",first.student.usuarioId!,201], ["student",teacherUser.id,201], ["admin",teacherUser.id,201], ["teacher",admin.id,201], ["teacher",other.student.usuarioId!,403]] as const) {
      const response = await call("/messages", who, { scope: "directo", recipientUserId: String(id), contenido: "Mensaje de prueba" });
      assert.equal(response.status, expected, `${who} -> ${id}: ${await response.text()}`);
    }
    assert.equal((await call("/messages", "admin", { scope: "directo", roomId: `direct:${admin.id}:${first.student.usuarioId}`, contenido: "Intento" })).status,403);
  });
  await t.test("announcements cannot be answered", async () => {
    const notice = await call("/announcements", "admin", { scope: "global", contenido: "Aviso de prueba" });
    assert.equal(notice.status,201);
    assert.equal((await call("/announcements", "student", { scope: "global", roomId: "global:institucional", contenido: "Respuesta" })).status,403);
  });
  await t.test("director cannot enter marks or attendance", async () => {
    assert.equal((await call("/grades", "admin", { studentId: String(first.student.id), courseId: String(course.id), periodoId: String(period.id), nota: 18 })).status,403);
    assert.equal((await call("/attendance", "admin", { studentId: String(first.student.id), fecha: "2026-09-19", presente: true })).status,403);
  });
  await t.test("materials and activities are scoped and generate real events", async () => {
    const response = await call("/materials", "teacher", { courseId: String(course.id), titulo: "Lectura de prueba", tipo: "enlace", url: "https://example.org/reading" });
    assert.equal(response.status,201, await response.clone().text());
    const material = (await response.json()).data.item;
    assert.equal((await call(`/materials/${material.id}`, "student")).status,200);
    await recordLmsEvent({ sub: String(first.student.usuarioId), role: "estudiante" }, "login");
    const indicators = await studentIndicators(first.student.id);
    assert.equal(indicators.recursos_consultados,1);
    assert.equal(indicators.frecuencia_acceso_lms,0.25);
    assert.equal(indicators.promedio_general,null);
  });
  await t.test("teacher records derive marks, attendance and completed activities", async () => {
    const mark = await call("/grades", "teacher", { studentId: String(first.student.id), courseId: String(course.id), periodoId: String(period.id), nota: 10 });
    assert.equal(mark.status, 201, await mark.text());
    for (const [fecha, presente, justificado] of [["2026-09-16", true, false], ["2026-09-17", false, false], ["2026-09-18", false, true]] as const) {
      const r = await call("/attendance", "teacher", { studentId: String(first.student.id), fecha, presente, justificado });
      assert.equal(r.status, 201, await r.text());
    }
    const created = await call("/activities", "teacher", { courseId: String(course.id), titulo: "Práctica comprobable", tipo: "practica" });
    assert.equal(created.status, 201);
    const activity = (await created.json()).data.item;
    assert.equal((await call(`/activities/${activity.id}/progress`, "student", { estado: "completada" }, "PATCH")).status, 409);
    assert.equal((await call(`/activities/${activity.id}/progress`, "student", { estado: "iniciada" }, "PATCH")).status, 200);
    assert.equal((await call(`/activities/${activity.id}/progress`, "student", { estado: "completada" }, "PATCH")).status, 200);
    const indicators = await studentIndicators(first.student.id);
    assert.equal(indicators.promedio_general, 10);
    assert.equal(indicators.cursos_desaprobados, 1);
    assert.equal(indicators.asistencia_general, 50);
    assert.equal(indicators.actividades_realizadas, 1);
  });
  await t.test("automatic alerts are deduplicated and preserve prediction history", async () => {
    const { persistPrediction } = await import("../src/services/prediction-persistence.service.js");
    const fixture = { score: 80, level: "alto" as const, probabilityAbandono: 0.8, modelName: "test-stub", recommendation: "Seguimiento de prueba", inputData: { promedio_general: 10 }, factors: [] };
    await persistPrediction(first.student.id, fixture, String(admin.id));
    await persistPrediction(first.student.id, fixture, String(admin.id));
    assert.equal(await prisma.prediction.count({ where: { studentId: first.student.id } }), 2);
    assert.equal(await prisma.alert.count({ where: { studentId: first.student.id } }), 1);
    assert.equal((await call("/predict", "student", { studentId: String(first.student.id) })).status, 403);
  });
  await t.test("teacher roster is restricted to directors", async () => {
    assert.equal((await call("/teachers", "admin")).status, 200);
    assert.equal((await call("/teachers", "teacher")).status, 403);
    assert.equal((await call("/teachers", "student")).status, 403);
  });
  await t.test("teachers cannot read grades from another teacher's course", async () => {
    const shared = await registerStudent(input("90000207"), String(admin.id));
    for (const [who, body, expected] of [
      ["teacher", { studentId: String(shared.student.id), courseId: String(course.id), periodoId: String(period.id), nota: 12 }, 201],
      ["teacherB", { studentId: String(shared.student.id), courseId: String(courseB.id), periodoId: String(period.id), nota: 16 }, 201],
    ] as const) {
      const r = await call("/grades", who, body);
      assert.equal(r.status, expected, await r.text());
    }
    const ownA = await call(`/grades?studentId=${shared.student.id}&courseId=${course.id}&periodoId=${period.id}`, "teacher");
    assert.equal(ownA.status, 200);
    assert.equal(((await ownA.json()).data.items as unknown[]).length, 1);
    assert.equal((await call(`/grades?studentId=${shared.student.id}&courseId=${courseB.id}&periodoId=${period.id}`, "teacher")).status, 403);
    const allA = await call("/grades", "teacher");
    assert.equal(allA.status, 200);
    for (const g of ((await allA.json()).data.items as { courseId: string }[])) assert.equal(g.courseId, String(course.id));
    assert.equal((await call(`/grades?courseId=${course.id}`, "teacherB")).status, 403);
    const allB = await call("/grades", "teacherB");
    assert.equal(allB.status, 200);
    for (const g of ((await allB.json()).data.items as { courseId: string }[])) assert.equal(g.courseId, String(courseB.id));
    assert.equal((await call(`/grades?courseId=${courseB.id}`, "admin")).status, 200);
  });
  await t.test("teachers are confined to their own courses", async () => {
    assert.equal((await call("/students", "teacher", { dni: "90000999", nombres: "X", apellidos: "Y", seccionId: String(section.id) })).status, 403);
    assert.equal((await call("/teachers", "teacher", { dni: "90000998", nombres: "X", apellidos: "Y", especialidad: "Z", correo: "x@y.test" })).status, 403);
    assert.equal((await call("/matriculas", "teacher", { estudianteId: String(first.student.id), seccionId: String(section.id), anioLectivoId: String(year.id) })).status, 403);
    assert.equal((await call("/materials", "teacher", { courseId: String(courseB.id), titulo: "Ajena", tipo: "enlace", url: "https://example.org/x" })).status, 403);
    assert.equal((await call("/activities", "teacher", { courseId: String(courseB.id), titulo: "Ajena", tipo: "practica" })).status, 403);
    assert.equal((await call("/announcements", "teacher", { scope: "curso", courseId: String(courseB.id), contenido: "Aviso ajeno" })).status, 403);
    assert.equal((await call("/predict", "teacher", { studentId: String(other.student.id) })).status, 403);
  });
  await t.test("students are read-only for predictions and institutional data", async () => {
    assert.equal((await call("/estudiante/prediccion", "student")).status, 200);
    assert.equal((await call("/estudiante/prediccion", "student", { studentId: String(first.student.id) })).status, 404);
    assert.equal((await call("/reports", "student")).status, 403);
    assert.equal((await call("/dashboard-snapshot/1", "student")).status, 403);
    assert.equal((await call("/recommendations/1/apply", "student", {}, "PATCH")).status, 403);
    assert.equal((await call("/grades", "student", { studentId: String(first.student.id), courseId: String(course.id), nota: 18 })).status, 403);
    assert.equal((await call("/attendance", "student", { studentId: String(first.student.id), fecha: "2026-09-20", presente: true })).status, 403);
    assert.equal((await call("/alerts/1", "student", { status: "resuelta" }, "PATCH")).status, 403);
    assert.equal((await call("/announcements", "student", { scope: "global", contenido: "x" })).status, 403);
  });
  await t.test("recommendations and risks respect staff scope", async () => {
    const rec = await prisma.aiRecommendation.findFirst({ where: { studentId: first.student.id } });
    assert.ok(rec);
    assert.equal((await call(`/recommendations/${rec.id}/apply`, "teacher", {}, "PATCH")).status, 200);
    const { persistPrediction } = await import("../src/services/prediction-persistence.service.js");
    await persistPrediction(other.student.id, { score: 80, level: "alto" as const, probabilityAbandono: 0.8, modelName: "test-stub", recommendation: "x", inputData: {}, factors: [] }, String(admin.id));
    const otherRec = await prisma.aiRecommendation.findFirst({ where: { studentId: other.student.id } });
    assert.ok(otherRec);
    assert.equal((await call(`/recommendations/${otherRec.id}/apply`, "teacher", {}, "PATCH")).status, 403);
    assert.equal((await call(`/student-risks?studentId=${other.student.id}`, "teacher")).status, 403);
  });
  await t.test("asistencia por fecha exacta ignora timezone", async () => {
    for (const fecha of ["2026-09-19", "2026-09-20", "2026-09-21"]) {
      const r = await call("/attendance", "teacher", { studentId: String(first.student.id), fecha, presente: true });
      assert.equal(r.status, 201, await r.text());
    }
    const day = await call("/attendance?fecha=2026-09-20", "admin");
    assert.equal(day.status, 200);
    const fechas = ((await day.json()).data.items as { fecha: string }[]).map((a) => String(a.fecha).slice(0, 10));
    assert.ok(fechas.length > 0);
    for (const f of fechas) assert.equal(f, "2026-09-20");
  });
  await t.test("listados con búsqueda y paginación real", async () => {    const paged = await call("/students?page=1&limit=2", "admin");
    assert.equal(paged.status, 200);
    const body = (await paged.json()).data;
    assert.ok(body.items.length <= 2);
    assert.ok(typeof body.total === "number" && typeof body.pages === "number");
    const searched = await call("/students?q=EST-201", "admin");
    assert.equal(searched.status, 200);
    for (const s of ((await searched.json()).data.items as { codigo: string }[])) {
      assert.ok(s.codigo.includes("EST-201"));
    }
    const mat = await call(`/matriculas?q=${first.student.codigo}&page=1&limit=5`, "admin");
    assert.equal(mat.status, 200);
    const matBody = (await mat.json()).data;
    assert.ok(matBody.items.length >= 1 && matBody.total >= 1);
    const att = await call(`/attendance?gradoId=${grade.id}&page=1&limit=5`, "admin");
    assert.equal(att.status, 200);
    assert.ok(typeof ((await att.json()).data.total) === "number");
    const attQ = await call("/attendance?q=Alumno", "admin");
    assert.equal(attQ.status, 200);
  });
  await t.test("cuenta docente exige contraseña segura", async () => {
    const t = await prisma.teacher.create({ data: { codigo: "PROF-099", nombres: "Sin", apellidos: "Cuenta", especialidad: "Arte", email: "sin-cuenta@example.test" } });
    assert.equal((await call(`/teachers/${t.id}/account`, "admin", { password: "weak" })).status, 400);
    assert.equal((await call(`/teachers/${t.id}/account`, "admin", { password: "Fuerte123" })).status, 201);
  });
  await t.test("RBAC listado general de estudiantes", async () => {
    assert.equal((await call("/students", "admin")).status, 200);
    assert.equal((await call("/students", "teacher")).status, 403);
    assert.equal((await call("/students", "student")).status, 403);
    assert.equal((await call("/estudiante/perfil", "student")).status, 200);
  });
  await t.test("dashboard snapshot solo lo escribe el director", async () => {
    const payload = { periodo: String(period.id), totalEstudiantes: 5, alertasAbiertas: 1 };
    assert.equal((await call("/dashboard-snapshot", "admin", payload)).status, 200);
    assert.equal((await call("/dashboard-snapshot", "teacher", payload)).status, 403);
    assert.equal((await call("/dashboard-snapshot", "student", payload)).status, 403);
  });

  await t.test("alertas combinan grado+seccion+profesor+busqueda", async () => {
    const r = await call(`/alerts?gradoId=${grade.id}&seccionId=${section.id}&profesorId=${teacher.id}&search=Alumno`, "admin");
    assert.equal(r.status, 200);
    const items = ((await r.json()).data.items as { student: { seccionId: string; nombres: string; apellidos: string } }[]);
    assert.ok(items.length > 0);
    for (const a of items) {
      assert.equal(String(a.student.seccionId), String(section.id));
      assert.ok(`${a.student.nombres} ${a.student.apellidos}`.includes("Alumno"));
    }
  });
  await t.test("profesor no accede al listado general de estudiantes", async () => {
    assert.equal((await call("/students?page=1&limit=5", "admin")).status, 200);
    assert.equal((await call("/students?page=1&limit=5", "teacher")).status, 403);
  });
  await t.test("estudiante retirado pierde scopes dependientes de matrícula", async () => {
    const mat = await prisma.matricula.findFirstOrThrow({ where: { estudianteId: first.student.id, anioLectivoId: year.id } });
    assert.equal((await call(`/matriculas/${mat.id}`, "admin", { estado: "retirada" }, "PATCH")).status, 200);
    assert.equal((await call(`/students/${first.student.id}`, "teacher")).status, 403);
    assert.equal((await call("/estudiante/dashboard", "student")).status, 200);
    assert.equal((await call("/estudiante/notas", "student")).status, 200);
  });
  await t.test("salonSummary es global aunque la página sea parcial", async () => {
    const r = await call("/alerts?limit=1&page=1", "admin");
    assert.equal(r.status, 200);
    const body = (await r.json()).data;
    assert.equal(body.items.length, 1);
    assert.ok(body.total >= 2);
    const sum = (body.salonSummary as { count: number }[]).reduce((a, s) => a + s.count, 0);
    assert.ok(sum >= 2);
  });
  await t.test("mensajería refleja solo relaciones activas 2026", async () => {
    const rel = await registerStudent(input("90000208"), String(admin.id));
    const relUserId = String(rel.student.usuarioId!);
    const otherToken = token(other.student.usuarioId!, "estudiante");
    const roomsFor = async (tok: string) => {
      const r = await fetch(base + "/messages/rooms", { headers: { Authorization: `Bearer ${tok}` } });
      assert.equal(r.status, 200);
      return (await r.json()).data.rooms as { roomId: string; label: string }[];
    };
    const before = await roomsFor(tokens.teacher);
    assert.ok(before.some((r) => r.roomId.includes(relUserId)), "sala activa debe aparecer");
    const otherRooms = await roomsFor(tokens.teacherB);
    assert.ok(!otherRooms.some((r) => r.roomId.includes(String(other.student.usuarioId))), "profesor ajeno no aparece");
    const mat = await prisma.matricula.findFirstOrThrow({ where: { estudianteId: rel.student.id, anioLectivoId: year.id } });
    assert.equal((await call(`/matriculas/${mat.id}`, "admin", { estado: "retirada" }, "PATCH")).status, 200);
    const after = await roomsFor(tokens.teacher);
    assert.ok(!after.some((r) => r.roomId.includes(relUserId)), "retirado no aparece");
    const cursoRoom = `curso:${course.id}`;
    assert.equal((await fetch(base + `/messages/${cursoRoom}`, { headers: { Authorization: `Bearer ${otherToken}` } })).status, 403);
  });
  await t.test("profesor con asignacion activa no se desactiva por PUT", async () => {
    const r = await call(`/teachers/${teacher.id}`, "admin", { activo: false }, "PUT");
    assert.equal(r.status, 409, await r.text());
    const lonelyUser = await prisma.user.create({ data: { rolId: roles[1].id, email: "test-lonely@example.test", passwordHash: "unused", nombres: "Sin", apellidos: "Carga" } });
    const lonely = await prisma.teacher.create({ data: { usuarioId: lonelyUser.id, codigo: "PROF-098", nombres: "Sin", apellidos: "Carga", especialidad: "Arte", email: lonelyUser.email } });
    assert.equal((await call(`/teachers/${lonely.id}`, "admin", { activo: false }, "PUT")).status, 200);
    const row = await prisma.teacher.findUniqueOrThrow({ where: { id: lonely.id } });
    assert.equal(row.activo, false);
  });
  await t.test("reasignacion docente mantiene coherencia y conserva historial", async () => {
    const grade3 = await prisma.grado.create({ data: { nivelId: level.id, numero: 3, nombre: "TerceroT" } });
    const secD = await prisma.seccion.create({ data: { gradoId: grade3.id, nombre: "D", capacidad: 10 } });
    const catR = await prisma.cursoCatalogo.create({ data: { areaId: area.id, codigo: "TEST-REAS", nombre: "Reasignacion" } });
    const per2 = await prisma.periodoAcademico.create({ data: { anioLectivoId: year.id, numero: 2, nombre: "II-T", activo: true, fechaInicio: new Date("2026-06-01"), fechaFin: new Date("2026-08-31") } });
    const alu = await registerStudent(input("90000209", secD.id), String(admin.id));
    const assCreate = await call("/teacher-assignments", "admin", { profesorId: String(teacher.id), cursoId: String(catR.id), seccionId: String(secD.id) });
    assert.equal(assCreate.status, 201, await assCreate.text());
    const offering = await prisma.course.findFirstOrThrow({ where: { cursoId: catR.id, seccionId: secD.id, anioLectivoId: year.id } });
    assert.equal(String(offering.profesorId), String(teacher.id));
    const gradeBefore = await call("/grades", "teacher", { studentId: String(alu.student.id), courseId: String(offering.id), periodoId: String(per2.id), nota: 14 });
    assert.equal(gradeBefore.status, 201, await gradeBefore.text());
    const enrollBefore = await prisma.enrollment.count({ where: { studentId: alu.student.id, cursoOfertaId: offering.id, estado: "activa" } });
    assert.equal(enrollBefore, 1);
    assert.equal((await call(`/courses/${offering.id}`, "admin", { profesorId: String(teacherB.id) }, "PUT")).status, 400);
    assert.equal((await call(`/courses/${offering.id}`, "admin", { seccionId: String(section.id) }, "PUT")).status, 400);
    const re = await call(`/courses/${offering.id}/reassign`, "admin", { profesorId: String(teacherB.id) });
    assert.equal(re.status, 200, await re.text());
    const after = await prisma.course.findUniqueOrThrow({ where: { id: offering.id } });
    assert.equal(String(after.profesorId), String(teacherB.id));
    const assOld = await prisma.teacherCourseAssignment.findFirst({ where: { profesorId: teacher.id, cursoId: catR.id, seccionId: secD.id, anioLectivoId: year.id, activo: true } });
    assert.equal(assOld, null);
    const assNew = await prisma.teacherCourseAssignment.findFirstOrThrow({ where: { profesorId: teacherB.id, cursoId: catR.id, seccionId: secD.id, anioLectivoId: year.id, activo: true } });
    assert.equal(String(assNew.cursoOfertaId), String(offering.id));
    assert.equal(await prisma.enrollment.count({ where: { studentId: alu.student.id, cursoOfertaId: offering.id, estado: "activa" } }), 1);
    assert.equal(await prisma.grade.count({ where: { studentId: alu.student.id, cursoOfertaId: offering.id } }), 1);
    const oldAccess = await fetch(base + `/grades?courseId=${offering.id}`, { headers: { Authorization: `Bearer ${tokens.teacher}` } });
    assert.equal(oldAccess.status, 403);
    const newAccess = await fetch(base + `/grades?courseId=${offering.id}`, { headers: { Authorization: `Bearer ${tokens.teacherB}` } });
    assert.equal(newAccess.status, 200);
  });
  await t.test("traslado y retiro no crean segunda matricula y conservan historial", async () => {
    const tra = await registerStudent(input("90000210"), String(admin.id));
    const matTra = await prisma.matricula.findFirstOrThrow({ where: { estudianteId: tra.student.id, anioLectivoId: year.id } });
    assert.equal((await call(`/matriculas/${matTra.id}`, "admin", { estado: "trasladada" }, "PATCH")).status, 200);
    assert.equal(await prisma.matricula.count({ where: { estudianteId: tra.student.id, anioLectivoId: year.id } }), 1);
    const dup1 = await call("/matriculas", "admin", { estudianteId: String(tra.student.id), seccionId: String(section.id), anioLectivoId: String(year.id) });
    assert.equal(dup1.status, 409, await dup1.text());
    const dup2 = await call("/matriculas", "admin", { estudianteId: String(first.student.id), seccionId: String(section.id), anioLectivoId: String(year.id) });
    assert.equal(dup2.status, 409, await dup2.text());
    assert.ok(await prisma.grade.count({ where: { studentId: first.student.id } }) >= 1);
    assert.ok(await prisma.attendance.count({ where: { studentId: first.student.id } }) >= 1);
    assert.ok(await prisma.auditLog.count({ where: { estudianteId: first.student.id } }) >= 1);
  });
});
