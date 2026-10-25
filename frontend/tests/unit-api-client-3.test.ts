import test from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1";

const mockFetchResponses: Record<string, { status: number; body: any }> = {};
globalThis.fetch = async (url: string | Request, _init?: RequestInit) => {
  const urlStr = typeof url === "string" ? url : url.url;
  const sortedKeys = Object.keys(mockFetchResponses).sort((a, b) => b.length - a.length);
  const key = sortedKeys.find((k) => urlStr.includes(k));
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

test("api.getStudents returns list", async () => {
  mockFetchResponses["/students"] = { status: 200, body: { items: [{ id: "1", codigo: "E1", nombres: "A", apellidos: "B", codigo: "E1", estado: "activo", promedioGeneral: 15, asistenciaGeneral: 90, lmsEngagement: "alto", activo: true, createdAt: "2026-01-01", updatedAt: "2026-01-01", lmsActividades: [], predictions: [], alerts: [] }], total: 1, page: 1, pages: 1 } };
  const res = await api.getStudents();
  assert.strictEqual(res.total, 1);
});

test("api.updateStudent updates student", async () => {
  mockFetchResponses["/students/1"] = { status: 200, body: { student: { id: "1", nombres: "Ana M", apellidos: "G", estado: "activo", promedioGeneral: 15, asistenciaGeneral: 90, lmsEngagement: "alto", activo: true, fechaIngreso: "2026-01-01", createdAt: "2026-01-01", updatedAt: "2026-01-01", lmsActividades: [], predictions: [], alerts: [] } } };
  const res = await api.updateStudent("1", { nombres: "Ana M" });
  assert.strictEqual(res.student.nombres, "Ana M");
});

test("api.deleteStudent deletes student", async () => {
  mockFetchResponses["/students/1"] = { status: 200, body: { ok: true } };
  const res = await api.deleteStudent("1");
  assert.strictEqual(res.ok, true);
});

test("api.createTeacher creates teacher", async () => {
  mockFetchResponses["/teachers"] = { status: 201, body: { teacher: { id: "t1", codigo: "T1", nombres: "Ana", apellidos: "G", especialidad: "Mat", correo: "ana@t.com", telefono: null, activo: true } } };
  const res = await api.createTeacher({ nombres: "Ana", apellidos: "G", especialidad: "Mat", correo: "ana@t.com", telefono: "123456789", crearCuenta: false });
  assert.strictEqual(res.teacher.id, "t1");
});

test("api.updateTeacher updates teacher", async () => {
  mockFetchResponses["/teachers/t1"] = { status: 200, body: { teacher: { id: "t1", nombres: "Ana M", apellidos: "G", especialidad: "Mat", correo: "ana@t.com", telefono: null, activo: true } } };
  const res = await api.updateTeacher("t1", { nombres: "Ana M" });
  assert.strictEqual(res.teacher.nombres, "Ana M");
});

test("api.deleteTeacher deletes teacher", async () => {
  mockFetchResponses["/teachers/t1"] = { status: 200, body: { ok: true } };
  const res = await api.deleteTeacher("t1");
  assert.strictEqual(res.ok, true);
});

test("api.createTeacherAccount creates account", async () => {
  mockFetchResponses["/teachers/t1/account"] = { status: 201, body: { teacher: { id: "t1", correo: "ana@t.com", activo: true } } };
  const res = await api.createTeacherAccount("t1", "Pass123");
  assert.strictEqual(res.teacher.correo, "ana@t.com");
});

test("api.getTeacherDetail returns detail", async () => {
  mockFetchResponses["/teachers/t1/detail"] = { status: 200, body: { teacher: { id: "t1", nombres: "Ana", apellidos: "G", especialidad: "Mat", correo: "ana@t.com", telefono: null }, workload: { tipoAsignacion: "docente", cursos: [], grados: [], secciones: [], cargaAcademica: 0, totalAlumnos: 0, asignaciones: [] } } };
  const res = await api.getTeacherDetail("t1");
  assert.strictEqual(res.teacher.nombres, "Ana");
});

test("api.getTeacherAssignments returns assignments", async () => {
  mockFetchResponses["/teacher-assignments"] = { status: 200, body: { items: [{ id: "a1", profesorId: "t1", cursoId: "c1", seccionId: "s1", anioLectivoId: "y1", esTutor: true }], total: 1 } };
  const res = await api.getTeacherAssignments();
  assert.strictEqual(res.total, 1);
});

test("api.createTeacherAssignment creates assignment", async () => {
  mockFetchResponses["/teacher-assignments"] = { status: 201, body: { item: { id: "a1", profesorId: "t1", cursoId: "c1", seccionId: "s1" } } };
  const res = await api.createTeacherAssignment({ profesorId: "t1", cursoId: "c1", seccionId: "s1" });
  assert.strictEqual(res.item.id, "a1");
});

test("api.createTutorAssignment creates tutorship", async () => {
  mockFetchResponses["/teacher-assignments/tutor"] = { status: 201, body: { tutor: true, totalCursos: 1, seccionId: "s1" } };
  const res = await api.createTutorAssignment({ profesorId: "t1", seccionId: "s1" });
  assert.strictEqual(res.tutor, true);
});

test("api.deactivateTeacherAssignment deactivates", async () => {
  mockFetchResponses["/teacher-assignments/a1/deactivate"] = { status: 200, body: { id: "a1", activo: false } };
  const res = await api.deactivateTeacherAssignment("a1");
  assert.strictEqual(res.activo, false);
});

test("api.getNiveles returns levels", async () => {
  mockFetchResponses["/academic/niveles"] = { status: 200, body: { items: [{ id: 1, numero: 1, nombre: "Primero", label: "1ro" }] } };
  const res = await api.getNiveles();
  assert.strictEqual(res.items[0].numero, 1);
});

test("api.getSecciones returns sections", async () => {
  mockFetchResponses["/academic/secciones"] = { status: 200, body: { items: [{ id: "s1", nombre: "A", capacidad: 30 }] } };
  const res = await api.getSecciones();
  assert.strictEqual(res.items[0].nombre, "A");
});

test("api.getCursosCatalogo returns catalog", async () => {
  mockFetchResponses["/academic/cursos-catalogo"] = { status: 200, body: { items: [{ id: "cat1", codigo: "MAT", nombre: "Matemáticas", area: "Ciencias" }] } };
  const res = await api.getCursosCatalogo();
  assert.strictEqual(res.items[0].nombre, "Matemáticas");
});

test("api.getProfesorCursos returns courses", async () => {
  mockFetchResponses["/profesor/cursos"] = { status: 200, body: { items: [{ id: "c1", codigo: "M1", nombre: "Matemáticas" }], total: 1 } };
  const res = await api.getProfesorCursos();
  assert.strictEqual(res.total, 1);
});

test("api.getProfesorSecciones returns sections", async () => {
  mockFetchResponses["/profesor/secciones"] = { status: 200, body: { items: [{ id: "s1", nombre: "A" }] } };
  const res = await api.getProfesorSecciones();
  assert.strictEqual(res.items[0].nombre, "A");
});

test("api.getProfesorEstudiantes returns students", async () => {
  mockFetchResponses["/profesor/estudiantes"] = { status: 200, body: { items: [{ id: "s1", nombres: "Juan", apellidos: "P", codigo: "E1", estado: "activo", promedioGeneral: 15, asistenciaGeneral: 90, lmsEngagement: "alto", activo: true, createdAt: "2026-01-01", updatedAt: "2026-01-01", lmsActividades: [], predictions: [], alerts: [] }], total: 1 } };
  const res = await api.getProfesorEstudiantes();
  assert.strictEqual(res.total, 1);
});

test("api.getProfesorGrades returns grades", async () => {
  mockFetchResponses["/profesor/notas"] = { status: 200, body: { items: [{ id: "g1", estudianteId: "s1", cursoId: "c1", nota: 15 }] } };
  const res = await api.getProfesorGrades();
  assert.strictEqual(res.items[0].nota, 15);
});

test("api.getProfesorAttendance returns attendance", async () => {
  mockFetchResponses["/profesor/asistencia"] = { status: 200, body: { items: [{ id: "a1", estudianteId: "s1", fecha: "2026-01-01", presente: true }] } };
  const res = await api.getProfesorAttendance();
  assert.strictEqual(res.items[0].presente, true);
});

test("api.getProfesorAlertas returns alerts", async () => {
  mockFetchResponses["/profesor/alertas"] = { status: 200, body: { items: [{ id: "al1", estudianteId: "s1", titulo: "Alerta", descripcion: "Test", nivelRiesgo: "alto", estado: "nueva" }], total: 1 } };
  const res = await api.getProfesorAlertas();
  assert.strictEqual(res.items[0].titulo, "Alerta");
});

test("api.updateCourse updates course", async () => {
  mockFetchResponses["/courses/c1"] = { status: 200, body: { course: { id: "c1", nombre: "Matemáticas Avanzadas" } } };
  const res = await api.updateCourse("c1", { nombre: "Matemáticas Avanzadas" });
  assert.strictEqual(res.course.nombre, "Matemáticas Avanzadas");
});

test("api.deleteCourse deletes course", async () => {
  mockFetchResponses["/courses/c1"] = { status: 200, body: { ok: true } };
  const res = await api.deleteCourse("c1");
  assert.strictEqual(res.ok, true);
});

test("api.reassignCourse reassigns course", async () => {
  mockFetchResponses["/courses/c1/reassign"] = { status: 200, body: { item: { profesorId: "t2" } } };
  const res = await api.reassignCourse("c1", "t2");
  assert.strictEqual(res.item.profesorId, "t2");
});

test("api.getMatriculas returns enrollments", async () => {
  mockFetchResponses["/matriculas"] = { status: 200, body: { items: [{ id: "m1", estudianteId: "s1", seccionId: "s1", estado: "activa" }], total: 1, activas: 1 } };
  const res = await api.getMatriculas();
  assert.strictEqual(res.total, 1);
});

test("api.updateMatriculaState updates status", async () => {
  mockFetchResponses["/matriculas/m1"] = { status: 200, body: { estado: "retirada" } };
  const res = await api.updateMatriculaState("m1", "retirada");
  assert.strictEqual(res.estado, "retirada");
});

test("api.createMatricula creates enrollment", async () => {
  mockFetchResponses["/matriculas"] = { status: 201, body: { item: { id: "m1", estudianteId: "s1", seccionId: "s1", estado: "activa" } } };
  const res = await api.createMatricula({ estudianteId: "s1", seccionId: "s1", anioLectivoId: "y1" });
  assert.strictEqual(res.item.estado, "activa");
});

test("api.getMatriculaStats returns stats", async () => {
  mockFetchResponses["/matriculas/stats"] = { status: 200, body: { matriculasActivas: 10, matriculasAnioLectivo: 10, estudiantesActivos: 10, anioLectivo: "2026", matriculadosIds: ["s1"] } };
  const res = await api.getMatriculaStats();
  assert.strictEqual(res.matriculasActivas, 10);
});

test("api.getAniosLectivos returns years", async () => {
  mockFetchResponses["/academic/anios-lectivos"] = { status: 200, body: { items: [{ id: "y1", anio: 2026, nombre: "2026", activo: true }] } };
  const res = await api.getAniosLectivos();
  assert.strictEqual(res.items[0].anio, 2026);
});

test("api.createGrade creates grade", async () => {
  mockFetchResponses["/grades"] = { status: 201, body: { item: { id: "g1", estudianteId: "s1", cursoId: "c1", nota: 15 } } };
  const res = await api.createGrade({ estudianteId: "s1", cursoId: "c1", nota: 15 });
  assert.strictEqual(res.item.nota, 15);
});

test("api.deleteGrade deletes grade", async () => {
  mockFetchResponses["/grades/g1"] = { status: 200, body: { ok: true } };
  const res = await api.deleteGrade("g1");
  assert.strictEqual(res.ok, true);
});

test("api.bulkAttendance saves attendance", async () => {
  mockFetchResponses["/attendance/bulk"] = { status: 201, body: { upserted: 5, fecha: "2026-01-15" } };
  const res = await api.bulkAttendance({ fecha: "2026-01-15", records: [{ studentId: "s1", presente: true, justificado: false, tardanza: false }] });
  assert.strictEqual(res.upserted, 5);
});

test("api.updateAttendance updates attendance", async () => {
  mockFetchResponses["/attendance/a1"] = { status: 200, body: { estado: "presente" } };
  const res = await api.updateAttendance("a1", { presente: false });
  assert.strictEqual(res.estado, "presente");
});

test("api.deleteAttendance deletes attendance", async () => {
  mockFetchResponses["/attendance/a1"] = { status: 200, body: { ok: true } };
  const res = await api.deleteAttendance("a1");
  assert.strictEqual(res.ok, true);
});

test("api.updateAlertStatus updates status", async () => {
  mockFetchResponses["/alerts/al1"] = { status: 200, body: { item: { id: "al1", estado: "en_seguimiento" } } };
  const res = await api.updateAlertStatus("al1", "en_seguimiento");
  assert.strictEqual(res.item.estado, "en_seguimiento");
});

test("api.getNotifications returns notifications", async () => {
  mockFetchResponses["/notifications"] = { status: 200, body: { items: [{ id: "n1", usuarioId: "u1", tipo: "alerta", titulo: "Test", mensaje: "Msg", leida: false, createdAt: "2026-01-01" }] } };
  const res = await api.getNotifications();
  assert.strictEqual(res.items[0].titulo, "Test");
});

test("api.markNotificationRead marks read", async () => {
  mockFetchResponses["/notifications/n1/read"] = { status: 200, body: { updated: 1 } };
  const res = await api.markNotificationRead("n1");
  assert.strictEqual(res.updated, 1);
});

test("api.getMessageRooms returns rooms", async () => {
  mockFetchResponses["/messages/rooms"] = { status: 200, body: { rooms: [{ roomId: "r1", label: "Sala 1", scope: "global" }] } };
  const res = await api.getMessageRooms();
  assert.strictEqual(res.rooms[0].roomId, "r1");
});

test("api.getMessages returns messages", async () => {
  mockFetchResponses["/messages/r1"] = { status: 200, body: { items: [{ id: "m1", salaId: "r1", remitenteId: "u1", contenido: "Hola", createdAt: "2026-01-01" }] } };
  const res = await api.getMessages("r1");
  assert.strictEqual(res.items[0].contenido, "Hola");
});

test("api.sendMessage sends message", async () => {
  mockFetchResponses["/messages"] = { status: 201, body: { message: { id: "m2", salaId: "r1", remitenteId: "u1", contenido: "Mundo", createdAt: "2026-01-01" } } };
  const res = await api.sendMessage({ roomId: "r1", contenido: "Mundo" });
  assert.strictEqual(res.message.contenido, "Mundo");
});

test("api.markMessagesRead marks read", async () => {
  mockFetchResponses["/messages/r1/read"] = { status: 200, body: { marked: 2 } };
  const res = await api.markMessagesRead("r1");
  assert.strictEqual(res.marked, 2);
});

test("api.getAuditLogs returns audit logs", async () => {
  mockFetchResponses["/admin/audit-logs"] = { status: 200, body: { items: [{ id: "aud1", entidad: "User", accion: "LOGIN", usuarioId: "u1" }], pagination: { page: 1, limit: 50, total: 1, pages: 1 } } };
  const res = await api.getAuditLogs();
  assert.strictEqual(res.items[0].accion, "LOGIN");
});

test("api.getSystemStats returns stats", async () => {
  mockFetchResponses["/admin/system-stats"] = { status: 200, body: { stats: { totalUsers: 5, totalStudents: 10, totalTeachers: 2 } } };
  const res = await api.getSystemStats();
  assert.strictEqual(res.stats.totalStudents, 10);
});

test("api.getUsers returns users", async () => {
  mockFetchResponses["/admin/users"] = { status: 200, body: { items: [{ id: "u1", email: "a@b.com", nombres: "Ana", apellidos: "G", role: "estudiante", teacherId: null }], total: 1 } };
  const res = await api.getUsers();
  assert.strictEqual(res.items[0].role, "estudiante");
});

test("api.createUser creates user", async () => {
  mockFetchResponses["/admin/users"] = { status: 201, body: { user: { id: "u2", email: "nueva@b.com", nombres: "Nuevo", apellidos: "Ap", role: "docente", teacherId: null } } };
  const res = await api.createUser({ email: "nueva@b.com", nombres: "Nuevo", apellidos: "Ap", role: "docente", dni: "12345678", telefono: "123456789", password: "Pass123" });
  assert.strictEqual(res.user.email, "nueva@b.com");
});

test("api.updateUser updates user", async () => {
  mockFetchResponses["/admin/users/u1"] = { status: 200, body: { user: { id: "u1", email: "a@b.com", nombres: "Ana M", apellidos: "P", role: "estudiante", teacherId: null } } };
  const res = await api.updateUser("u1", { nombres: "Ana M" });
  assert.strictEqual(res.user.nombres, "Ana M");
});

test("api.deleteUser deletes user", async () => {
  mockFetchResponses["/admin/users/u1"] = { status: 200, body: { ok: true } };
  const res = await api.deleteUser("u1");
  assert.strictEqual(res.ok, true);
});
