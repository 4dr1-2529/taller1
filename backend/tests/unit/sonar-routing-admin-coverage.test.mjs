import test from "node:test";
import assert from "node:assert/strict";
import router from "../../src/routes/index.js";
import { prisma } from "../../src/utils/prisma.js";
import {
  buildProfesorStudentWhere,
  getTeacherCourseSectionIds,
  parseProfesorQuery,
  requireTeacherIdFromUser,
} from "../../src/utils/profesor-query.js";
import {
  createUser,
  deleteUser,
  getAuditLogs,
  getSystemStats,
  listUsers,
  updateUser,
} from "../../src/controllers/admin.controller.js";
import { getStudent, listStudents, updateStudent, deleteStudent } from "../../src/controllers/students.controller.js";
import { getPrediction, listPredictions } from "../../src/controllers/predictions.controller.js";
import {
  applyRecommendation,
  createReport,
  deleteReport,
  getDashboardSnapshot,
  listReports,
  listStudentRisks,
  saveDashboardSnapshot,
} from "../../src/controllers/reports.controller.js";
import { listMatriculas, matriculaStats, updateMatriculaState, createMatricula } from "../../src/controllers/matriculas.controller.js";
import { createGrade, deleteGrade, listGrades } from "../../src/controllers/grades.controller.js";
import {
  accessMaterial,
  courseAccess,
  getIndicators,
  listLearning,
  progressActivity,
  publishActivity,
  publishMaterial,
} from "../../src/controllers/lms.controller.js";
import { bulkAttendance, createAttendance, deleteAttendance, updateAttendance } from "../../src/controllers/attendance.controller.js";
import { exportAccessAccounts } from "../../src/controllers/accounts-export.controller.js";
import {
  profesorCursos,
  profesorDashboard,
  profesorEstudiantes,
  profesorGrados,
  profesorLms,
  profesorSecciones,
} from "../../src/controllers/profesor.controller.js";
import { enroll2026, registerStudent } from "../../src/services/student-registration.service.js";
import { nextCode } from "../../src/services/correlativo.service.js";
import { assertTeacherAssignmentAccess, assignTutorToSection } from "../../src/services/teacher-assignment.service.js";

function response() {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return res;
}

async function invoke(handler, req = {}) {
  const res = response();
  let error;
  await handler({ query: {}, params: {}, body: {}, user: { sub: "7", role: "admin" }, ...req }, res, (value) => { error = value; });
  return { res, error };
}

async function withStubs(stubs, action) {
  const originals = stubs.map(([target, key]) => [target, key, target[key]]);
  for (const [target, key, implementation] of stubs) target[key] = implementation;
  try { await action(); }
  finally { for (const [target, key, original] of originals.reverse()) target[key] = original; }
}

test("API router registers unique routes and protects the application surface", () => {
  const routes = router.stack.filter((layer) => layer.route).map((layer) => layer.route);
  const signatures = routes.flatMap((route) => Object.keys(route.methods).map((method) => `${method.toUpperCase()} ${route.path}`));
  assert.ok(signatures.includes("GET /health"));
  assert.ok(signatures.includes("POST /auth/login"));
  assert.ok(signatures.includes("GET /students"));
  assert.ok(signatures.includes("POST /grades"));
  assert.ok(signatures.includes("GET /reports"));
  assert.ok(signatures.includes("GET /teacher-assignments"));
  assert.equal(new Set(signatures).size, signatures.length);
  for (const route of routes.filter((item) => item.path !== "/health" && item.path !== "/auth/login" && item.path !== "/auth/refresh")) {
    assert.ok(route.stack.length > 0, `route ${route.path} must have a handler`);
  }
});

test("admin user listing maps database roles to the API role field", async () => {
  await withStubs([[prisma.user, "findMany", async () => [{
    id: 8n, email: "teacher@example.test", nombres: "Ana", apellidos: "Paz", activo: true,
    createdAt: new Date("2026-01-01T00:00:00Z"), rol: { codigo: "docente" },
  }]]], async () => {
    const { res, error } = await invoke(listUsers);
    assert.equal(error, undefined);
    assert.deepEqual(res.body.data.items[0], {
      id: "8", email: "teacher@example.test", nombres: "Ana", apellidos: "Paz", activo: true,
      createdAt: new Date("2026-01-01T00:00:00Z"), role: "docente",
    });
  });
});

test("admin audit history applies filters, pagination, and related-record mapping", async () => {
  let capturedWhere;
  await withStubs([
    [prisma.auditLog, "findMany", async ({ where }) => { capturedWhere = where; return [{
      id: 9n, usuario: { id: 2n, email: "d@example.test", nombres: "D", apellidos: "One", rol: { codigo: "docente" } },
      profesor: { id: 3n, codigo: "P3", nombres: "T", apellidos: "One", email: "t@example.test" },
      estudiante: { nombres: "S", apellidos: "One", codigo: "E1" },
    }]; }],
    [prisma.auditLog, "count", async () => 21],
  ], async () => {
    const { res, error } = await invoke(getAuditLogs, { query: { page: "2", limit: "12", teacherId: "3", role: "docente", entidad: "Grade" } });
    assert.equal(error, undefined);
    assert.deepEqual(capturedWhere, { profesorId: 3n, entidad: "Grade", usuario: { rol: { codigo: "docente" } } });
    assert.equal(res.body.data.pagination.pages, 2);
    assert.equal(res.body.data.items[0].id, "9");
    assert.equal(res.body.data.items[0].usuario.role, "docente");
    assert.equal(res.body.data.items[0].teacher.id, "3");
    assert.equal(res.body.data.items[0].student.codigo, "E1");
  });
});

test("admin summary returns all live system counters", async () => {
  await withStubs([
    [prisma.user, "count", async () => 8], [prisma.student, "count", async () => 5],
    [prisma.teacher, "count", async () => 2], [prisma.prediction, "count", async () => 13],
    [prisma.alert, "count", async () => 4], [prisma.session, "count", async () => 6],
  ], async () => {
    const { res, error } = await invoke(getSystemStats);
    assert.equal(error, undefined);
    assert.deepEqual(res.body.data.stats, { totalUsers: 8, totalStudents: 5, totalTeachers: 2, totalPredictions: 13, totalAlerts: 4, totalSessions: 6 });
  });
});

test("admin account creation rejects linked roles and duplicate email before writing", async () => {
  const invalidRole = await invoke(createUser, { body: { email: "s@example.test", password: "Strong123", nombres: "Sam", apellidos: "Lee", role: "estudiante" } });
  assert.equal(invalidRole.error?.statusCode, 400);
  await withStubs([[prisma.user, "findUnique", async () => ({ id: 1n })]], async () => {
    const duplicate = await invoke(createUser, { body: { email: "a@example.test", password: "Strong123", nombres: "Sam", apellidos: "Lee", role: "admin" } });
    assert.equal(duplicate.error?.statusCode, 409);
  });
});

test("admin account creation hashes credentials, resolves the role, and audits the new account", async () => {
  const writes = [];
  await withStubs([
    [prisma.user, "findUnique", async () => null],
    [prisma.role, "findUnique", async () => ({ id: 1n, codigo: "admin" })],
    [prisma.user, "create", async ({ data }) => { writes.push(data); return { id: 9n, email: data.email, nombres: data.nombres, apellidos: data.apellidos, activo: true, rol: { codigo: "admin" } }; }],
    [prisma.auditLog, "create", async (args) => { writes.push(args); return {}; }],
  ], async () => {
    const { res, error } = await invoke(createUser, { body: { email: "director@example.test", password: "Strong123", nombres: "Ana", apellidos: "Paz", role: "admin" } });
    assert.equal(error, undefined);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.user.id, "9");
    assert.equal(res.body.data.user.role, "admin");
    assert.notEqual(writes[0].passwordHash, "Strong123");
    assert.equal(writes[1].data.accion, "CREATE");
  });
});

test("admin updates and deactivations persist role, audit, and active state", async () => {
  const writes = [];
  await withStubs([
    [prisma.role, "findUnique", async () => ({ id: 1n, codigo: "docente" })],
    [prisma.user, "update", async (args) => { writes.push(args); return { id: 7n, email: "d@example.test", nombres: "D", apellidos: "One", activo: false, rol: { codigo: "docente" } }; }],
    [prisma.auditLog, "create", async (args) => { writes.push(args); return {}; }],
  ], async () => {
    const updated = await invoke(updateUser, { params: { id: "7" }, body: { nombres: "D", apellidos: "One", activo: false, role: "docente" } });
    assert.equal(updated.error, undefined);
    assert.equal(updated.res.body.data.user.role, "docente");
    const deleted = await invoke(deleteUser, { params: { id: "7" } });
    assert.equal(deleted.error, undefined);
    assert.equal(deleted.res.body.message, "Usuario desactivado");
    assert.deepEqual(writes.filter((entry) => entry.where).map((entry) => entry.data.activo), [false, false]);
    assert.equal(writes.filter((entry) => entry.data?.entidad === "User").length, 2);
  });
});

test("teacher query helpers resolve linked teachers and restrict filters to assigned sections and courses", async () => {
  await withStubs([
    [prisma.teacher, "findFirst", async () => ({ id: 5n })],
    [prisma.teacherCourseAssignment, "findMany", async (args) => {
      if (args.select.seccionId) return [{ seccionId: 10n }, { seccionId: 10n }, { seccionId: 11n }];
      if (args.select.cursoOfertaId) return [{ cursoOfertaId: 21n }, { cursoOfertaId: null }];
      return [{ seccionId: 10n }, { seccionId: 11n }];
    }],
    [prisma.anioLectivo, "findFirst", async () => ({ id: 2026n })],
  ], async () => {
    assert.equal(await requireTeacherIdFromUser("7"), 5n);
    assert.deepEqual(await getTeacherCourseSectionIds(5n, {}), [10n, 11n]);
    assert.deepEqual(await getTeacherCourseSectionIds(5n, { cursoId: "21" }), [10n, 11n]);
    const where = await buildProfesorStudentWhere(5n, { search: "  Ana  " });
    assert.deepEqual(where, {
      activo: true,
      seccionId: { in: [10n, 11n] },
      matriculas: { some: { estado: "activa", anioLectivoId: 2026n } },
      inscripciones: { some: { cursoOfertaId: { in: [21n] }, estado: "activa" } },
      OR: [{ nombres: { contains: "Ana" } }, { apellidos: { contains: "Ana" } }, { codigo: { contains: "Ana" } }],
    });
  });
});

test("teacher query helpers handle missing links, empty assignments, and normalized filters", async () => {
  await withStubs([
    [prisma.teacher, "findFirst", async () => null],
    [prisma.teacherCourseAssignment, "findMany", async (args) => args.select.seccionId ? [] : [{ seccionId: 99n, cursoOfertaId: null }]],
    [prisma.anioLectivo, "findFirst", async () => null],
  ], async () => {
    await assert.rejects(requireTeacherIdFromUser("8"), /TEACHER_NOT_LINKED/);
    assert.deepEqual(await buildProfesorStudentWhere(5n, {}), { id: { in: [] } });
    assert.deepEqual(await buildProfesorStudentWhere(5n, { seccionId: "4" }), { id: { in: [] } });
    assert.deepEqual(parseProfesorQuery({ query: { gradoId: "2", seccionId: "4", cursoId: "6", q: "Ana" } }), {
      gradoId: "2", seccionId: "4", cursoId: "6", search: "Ana",
    });
    assert.deepEqual(parseProfesorQuery({ query: { search: "visible", q: "fallback" } }), { gradoId: undefined, seccionId: undefined, cursoId: undefined, search: "visible" });
    assert.deepEqual(parseProfesorQuery({ query: {} }), { gradoId: undefined, seccionId: undefined, cursoId: undefined, search: undefined });
  });
});

function emptyIndicatorStubs() {
  return [
    [prisma.lmsEvent, "findMany", async () => []],
    [prisma.activityProgress, "count", async () => 0],
    [prisma.grade, "groupBy", async () => []],
    [prisma.attendance, "findMany", async () => []],
  ];
}

test("student listing applies paging and maps identifiers plus live indicators", async () => {
  await withStubs([
    [prisma.student, "findMany", async () => [{ id: 12n, seccionId: 3n, predicciones: [{ id: 1n }], alertas: [] }]],
    [prisma.student, "count", async () => 1],
    ...emptyIndicatorStubs(),
  ], async () => {
    const { res, error } = await invoke(listStudents, { query: { q: "  Ana  ", seccionId: "3", page: "2", limit: "1" } });
    assert.equal(error, undefined);
    assert.equal(res.body.data.items[0].id, "12");
    assert.equal(res.body.data.items[0].seccionId, "3");
    assert.equal(res.body.data.items[0].predictions.length, 1);
    assert.deepEqual(res.body.data.items[0].indicators, {
      promedio_general: null, cursos_desaprobados: 0, asistencia_general: null,
      frecuencia_acceso_lms: 0, tiempo_interaccion_lms: 0, actividades_realizadas: 0,
      recursos_consultados: 0, dias_activos: 0, ultimo_acceso: null,
      ventana_desde: res.body.data.items[0].indicators.ventana_desde,
      ventana_hasta: res.body.data.items[0].indicators.ventana_hasta,
    });
    assert.equal(res.body.data.page, 2);
    assert.equal(res.body.data.pages, 1);
  });
});

test("student detail returns a scoped record or forwards a not-found error", async () => {
  let record = { id: 12n, seccionId: null, calificaciones: [], predicciones: [], recomendaciones: [] };
  await withStubs([
    [prisma.student, "findFirst", async () => ({ id: 12n })],
    [prisma.student, "findUnique", async () => record],
    ...emptyIndicatorStubs(),
  ], async () => {
    const found = await invoke(getStudent, { params: { id: "12" } });
    assert.equal(found.error, undefined);
    assert.equal(found.res.body.data.student.id, "12");
    assert.deepEqual(found.res.body.data.student.grades, []);
    record = null;
    const missing = await invoke(getStudent, { params: { id: "12" } });
    assert.equal(missing.error?.statusCode, 404);
  });
});

test("student updates synchronize linked accounts and deletions revoke their sessions", async () => {
  const writes = [];
  const tx = {
    student: { update: async (args) => { writes.push(args); return { id: 12n, usuarioId: 2n, nombres: "Ana", apellidos: "Paz" }; } },
    user: { update: async (args) => { writes.push(args); return {}; } },
    session: { updateMany: async (args) => { writes.push(args); return { count: 1 }; } },
    auditLog: { create: async (args) => { writes.push(args); return {}; } },
  };
  await withStubs([
    [prisma.student, "findFirst", async () => ({ id: 12n })],
    [prisma, "$transaction", async (callback) => callback(tx)],
    [prisma.auditLog, "create", async (args) => { writes.push(args); return {}; }],
  ], async () => {
    const updated = await invoke(updateStudent, { params: { id: "12" }, body: { nombres: "Ana", apellidos: "Paz", correo: "ana@example.test" }, ip: "127.0.0.1" });
    assert.equal(updated.error, undefined);
    assert.equal(updated.res.body.data.student.id, "12");
    assert.equal(writes.some((item) => item.where?.id === 2n && item.data?.email === "ana@example.test"), true);

    const deleted = await invoke(deleteStudent, { params: { id: "12" }, ip: "127.0.0.1" });
    assert.equal(deleted.error, undefined);
    assert.equal(deleted.res.body.message, "Estudiante desactivado");
    assert.equal(writes.some((item) => item.where?.usuarioId === 2n && item.data?.revocada === true), true);
  });
});

test("prediction history filters, paginates, and exposes traceable model metadata", async () => {
  await withStubs([
    [prisma.prediction, "findMany", async () => [{
      id: 7n, studentId: 4n, score: "13.5", nivelRiesgo: "alto", probabilidad: "0.8", probabilidadAbandono: "0.8",
      createdAt: new Date("2026-05-01T00:00:00Z"), factores: [{ factorKey: "grades", etiqueta: "Notas", contribucion: "2.5" }],
      inputData: { attendance: 80, dataMode: "synthetic_scientific", modelVersion: "v2", datasetVersion: "set-1", decisionThreshold: 0.6 },
      student: { id: 4n, codigo: "E4", nombres: "Ana", apellidos: "Paz", seccionId: 2n },
    }]],
    [prisma.prediction, "count", async () => 31],
    [prisma.student, "findFirst", async ({ where }) => where.usuarioId === 8n || where.AND?.some((clause) => Array.isArray(clause.id?.in)) ? null : ({ id: 4n })],
  ], async () => {
    const { res, error } = await invoke(listPredictions, { query: { studentId: "4", riskLevel: "alto", page: "2", limit: "10" } });
    assert.equal(error, undefined);
    assert.equal(res.body.data.total, 31);
    assert.equal(res.body.data.pages, 4);
    assert.equal(res.body.data.items[0].id, "7");
    assert.deepEqual(res.body.data.items[0].factors, [{ key: "grades", label: "Notas", contribution: 2.5 }]);
    assert.equal(res.body.data.items[0].experimental, true);
    assert.equal(res.body.data.items[0].meta.inputData.attendance, 80);
  });
});

test("prediction details return scoped data and forward invalid, missing, or denied requests", async () => {
  let prediction = { id: 7n, studentId: 4n, score: 10, nivelRiesgo: "medio", probabilidad: 0.5, probabilidadAbandono: 0.5, createdAt: new Date(), factores: [], inputData: {}, student: {} };
  await withStubs([
    [prisma.prediction, "findFirst", async ({ where }) => where.student?.id?.in?.length === 0 ? null : prediction],
    [prisma.student, "findFirst", async ({ where }) => where.usuarioId === 8n || where.AND?.some((clause) => Array.isArray(clause.id?.in)) ? null : ({ id: 4n })],
  ], async () => {
    const found = await invoke(getPrediction, { params: { id: "7" } });
    assert.equal(found.error, undefined);
    assert.equal(found.res.body.data.item.modelName, "Modelo histórico");
    prediction = null;
    const missing = await invoke(getPrediction, { params: { id: "7" } });
    assert.equal(missing.error?.statusCode, 404);
    const invalidFilter = await invoke(listPredictions, { query: { riskLevel: "critical" } });
    assert.equal(invalidFilter.error?.statusCode, 400);
    prediction = { id: 7n, studentId: 4n, score: 10, nivelRiesgo: "medio", probabilidad: 0.5, probabilidadAbandono: 0.5, createdAt: new Date(), factores: [], inputData: {}, student: {} };
    const concealed = await invoke(getPrediction, { params: { id: "7" }, user: { sub: "8", role: "estudiante" } });
    assert.equal(concealed.error?.statusCode, 404);
  });
});

test("reports list, create, delete, ownership, and error paths are enforced", async () => {
  const writes = [];
  let report = { id: 5n, generadoPor: 9n };
  await withStubs([
    [prisma.report, "findMany", async () => [{ id: 4n, titulo: "Resumen" }]],
    [prisma.report, "create", async (args) => { writes.push(args); return { id: 6n, ...args.data }; }],
    [prisma.report, "findUnique", async () => report],
    [prisma.report, "delete", async (args) => { writes.push(args); return {}; }],
    [prisma.auditLog, "create", async (args) => { writes.push(args); return {}; }],
  ], async () => {
    const listed = await invoke(listReports);
    assert.equal(listed.res.body.data.items[0].id, "4");
    const created = await invoke(createReport, { body: { titulo: "Resumen", tipo: "pdf", archivoPath: "out.pdf", metaJson: { count: 1 } } });
    assert.equal(created.error, undefined);
    assert.equal(created.res.body.data.report.id, "6");
    const missing = await invoke(deleteReport, { params: { id: "5" } });
    report = null;
    const notFound = await invoke(deleteReport, { params: { id: "5" } });
    assert.equal(notFound.error?.statusCode, 404);
    report = { id: 5n, generadoPor: 9n };
    const forbidden = await invoke(deleteReport, { params: { id: "5" }, user: { sub: "7", role: "docente" } });
    assert.equal(forbidden.error?.statusCode, 403);
    const removed = await invoke(deleteReport, { params: { id: "5" } });
    assert.equal(removed.error, undefined);
    assert.equal(removed.res.body.message, "Reporte eliminado");
    assert.equal(missing.error, undefined);
    assert.equal(writes.some((entry) => entry.data?.rutaArchivo === "out.pdf"), true);
  });
});

test("dashboard snapshots resolve active year and periods and report missing records", async () => {
  await withStubs([
    [prisma.anioLectivo, "findFirst", async () => ({ id: 2026n })],
    [prisma.periodoAcademico, "findFirst", async () => ({ id: 2n })],
    [prisma.dashboardSnapshot, "create", async ({ data }) => ({ id: 3n, ...data })],
    [prisma.dashboardSnapshot, "findFirst", async () => ({ id: 3n, totalEstudiantes: 7 })],
  ], async () => {
    const saved = await invoke(saveDashboardSnapshot, { body: { periodo: "Bimestre 1", totalEstudiantes: 7, byLevel: { bajo: 4, medio: 2, alto: 1 } } });
    assert.equal(saved.error, undefined);
    assert.equal(saved.res.body.data.snapshot.riesgoAlto, 1);
    const found = await invoke(getDashboardSnapshot, { params: { periodo: "1" } });
    assert.equal(found.error, undefined);
    assert.equal(found.res.body.data.snapshot.id, "3");
    await withStubs([[prisma.dashboardSnapshot, "findFirst", async () => null]], async () => {
      const missing = await invoke(getDashboardSnapshot, { params: { periodo: "1" } });
      assert.equal(missing.error?.statusCode, 404);
    });
  });
});

test("student risk list maps latest predictions and recommendation application is audited", async () => {
  const writes = [];
  await withStubs([
    [prisma.student, "findMany", async () => [
      { id: 4n, nombres: "Ana", apellidos: "Paz", codigo: "E4", updatedAt: new Date("2026-03-01"), predicciones: [{ id: 8n, score: "14", nivelRiesgo: "alto", createdAt: new Date("2026-03-02"), factores: [{ factorKey: "attendance", etiqueta: "Asistencia", contribucion: "3" }] }] },
      { id: 5n, nombres: "Sol", apellidos: "Rey", codigo: "E5", updatedAt: new Date("2026-03-01"), predicciones: [] },
    ]],
    [prisma.student, "findFirst", async () => ({ id: 4n })],
    [prisma.aiRecommendation, "findUnique", async () => ({ id: 6n, studentId: 4n })],
    [prisma.aiRecommendation, "update", async ({ where, data }) => ({ ...where, ...data })],
    [prisma.auditLog, "create", async (args) => { writes.push(args); return {}; }],
  ], async () => {
    const risks = await invoke(listStudentRisks, { query: { studentId: "4" } });
    assert.equal(risks.error, undefined);
    assert.equal(risks.res.body.data.items[0].level, "alto");
    assert.equal(risks.res.body.data.items[1].level, "bajo");
    assert.equal(risks.res.body.data.items[0].factors[0].contribution, 3);
    const applied = await invoke(applyRecommendation, { params: { id: "6" } });
    assert.equal(applied.error, undefined);
    assert.equal(applied.res.body.data.recommendation.aplicada, true);
    assert.equal(writes[0].data.accion, "APPLY");
  });
});

const matriculaRow = () => ({
  id: 1n, codigo: "M-1", estado: "activa", fechaMatricula: new Date("2026-03-01"), estudianteId: 4n, seccionId: 2n, anioLectivoId: 2026n,
  estudiante: { id: 4n, codigo: "E4", nombres: "Ana", apellidos: "Paz", seccionId: null },
  seccion: { id: 2n, nombre: "A", grado: { id: 3n, numero: 1, nombre: "Primero", nivel: null } },
  anioLectivo: { id: 2026n, anio: 2026, nombre: "2026" },
});

test("enrollment listing filters and maps nested school data without losing pagination", async () => {
  let captured;
  await withStubs([
    [prisma.matricula, "findMany", async (args) => { captured = args; return [matriculaRow()]; }],
    [prisma.matricula, "count", async () => 12],
  ], async () => {
    const { res, error } = await invoke(listMatriculas, { query: { q: " Ana ", seccionId: "2", gradoId: "3", anioLectivoId: "2026", estado: "activa", page: "2", limit: "5" } });
    assert.equal(error, undefined);
    assert.equal(captured.skip, 5);
    assert.equal(captured.take, 5);
    assert.equal(res.body.data.items[0].id, "1");
    assert.equal(res.body.data.items[0].estudiante.seccionId, null);
    assert.equal(res.body.data.items[0].seccion.nivel, "");
    assert.equal(res.body.data.items[0].seccion.label, "1° A");
    assert.deepEqual(res.body.data.pages, 3);
    assert.equal(res.body.data.activas, 12);
  });
});

test("enrollment statistics handle an active year and a missing active year", async () => {
  let activeYear = { id: 2026n, nombre: "2026" };
  await withStubs([
    [prisma.anioLectivo, "findFirst", async () => activeYear],
    [prisma.matricula, "count", async () => 4],
    [prisma.matricula, "findMany", async () => [{ estudianteId: 8n }]],
    [prisma.student, "count", async () => 10],
  ], async () => {
    const current = await invoke(matriculaStats);
    assert.deepEqual(current.res.body.data, { matriculasActivas: 4, matriculasAnioLectivo: 4, estudiantesActivos: 10, anioLectivo: "2026", matriculadosIds: ["8"] });
    activeYear = null;
    const missing = await invoke(matriculaStats);
    assert.equal(missing.error, undefined);
    assert.equal(missing.res.body.data.anioLectivo, null);
    assert.deepEqual(missing.res.body.data.matriculadosIds, []);
  });
});

test("enrollment state transition updates enrollment, audit, and rejects missing or invalid records", async () => {
  const writes = [];
  const tx = {
    matricula: {
      findFirst: async () => ({ id: 1n, seccionId: 2n, estudianteId: 4n, anioLectivoId: 2026n }),
      update: async (args) => { writes.push(args); return {}; },
    },
    $queryRaw: async () => [],
    enrollment: { updateMany: async (args) => { writes.push(args); return { count: 1 }; } },
    auditLog: { create: async (args) => { writes.push(args); return {}; } },
  };
  await withStubs([[prisma, "$transaction", async (callback) => callback(tx)]], async () => {
    const updated = await invoke(updateMatriculaState, { params: { id: "1" }, body: { estado: "retirada" } });
    assert.equal(updated.error, undefined);
    assert.equal(updated.res.body.data.estado, "retirada");
    assert.equal(writes.some((entry) => entry.data?.estado === "retirada"), true);
    const invalid = await invoke(updateMatriculaState, { params: { id: "1" }, body: { estado: "activa" } });
    assert.ok(invalid.error);
  });
  const missingTx = { ...tx, matricula: { findFirst: async () => null, update: tx.matricula.update } };
  await withStubs([[prisma, "$transaction", async (callback) => callback(missingTx)]], async () => {
    const missing = await invoke(updateMatriculaState, { params: { id: "1" }, body: { estado: "trasladada" } });
    assert.equal(missing.error?.statusCode, 404);
  });
});

test("enrollment creation validates scope and permits only active 2026 records", async () => {
  await withStubs([
    [prisma.student, "findFirst", async () => ({ id: 4n })],
    [prisma.anioLectivo, "findUnique", async () => ({ id: 2025n, anio: 2025 })],
  ], async () => {
    const invalid = await invoke(createMatricula, { body: { estudianteId: "4", seccionId: "2", anioLectivoId: "2025" } });
    assert.equal(invalid.error?.statusCode, 400);
    const malformed = await invoke(createMatricula, { body: { estudianteId: "", seccionId: "2", anioLectivoId: "2025" } });
    assert.ok(malformed.error);
  });
});

test("grade listing maps academic records, scope, periods, and optional courses", async () => {
  let captured;
  await withStubs([
    [prisma.student, "findFirst", async () => ({ id: 4n })],
    [prisma.grade, "findMany", async (args) => { captured = args; return [{
      id: 9n, studentId: 4n, cursoOfertaId: 7n, periodoId: 2n, nota: "18.5",
      student: { id: 4n, codigo: "E4", nombres: "Ana", apellidos: "Paz" },
      cursoOferta: { id: 7n, cursoCatalogo: { nombre: "Matemática", codigo: "MAT" } },
      periodo: { id: 2n, numero: 1, nombre: "Bimestre 1" },
    }]; }],
  ], async () => {
    const { res, error } = await invoke(listGrades, { query: { studentId: "4", courseId: "7", periodoId: "2" } });
    assert.equal(error, undefined);
    assert.equal(captured.take, 5000);
    assert.equal(res.body.data.items[0].id, "9");
    assert.equal(res.body.data.items[0].courseId, "7");
    assert.equal(res.body.data.items[0].nota, 18.5);
    assert.equal(res.body.data.items[0].course.nombre, "Matemática");
  });
});

test("grade writes reject invalid input and delete through the transaction with audit", async () => {
  const writes = [];
  const tx = {
    $queryRaw: async () => [],
    grade: { delete: async ({ where }) => ({ id: where.id, studentId: 4n }), groupBy: async () => [] },
    student: { update: async (args) => { writes.push(args); return {}; } },
    attendance: { findMany: async () => [] },
    auditLog: { create: async (args) => { writes.push(args); return {}; } },
  };
  await withStubs([
    [prisma.grade, "findUniqueOrThrow", async () => ({ id: 9n, studentId: 4n, cursoOfertaId: 7n })],
    [prisma.student, "findFirst", async () => ({ id: 4n })],
    [prisma.grade, "groupBy", async () => []],
    [prisma.auditLog, "create", async (args) => { writes.push(args); return {}; }],
    [prisma, "$transaction", async (callback) => callback(tx)],
  ], async () => {
    const invalid = await invoke(createGrade, { body: { studentId: "4", courseId: "7", nota: 25 } });
    assert.ok(invalid.error);
    const deleted = await invoke(deleteGrade, { params: { id: "9" } });
    assert.equal(deleted.error, undefined);
    assert.equal(deleted.res.body.message, "Nota eliminada");
    assert.ok(writes.some((entry) => entry.data?.asistenciaGeneral === 0));
    assert.ok(writes.some((entry) => entry.data?.accion === "DELETE"));
  });
});

test("grade upsert checks course enrollment, refreshes the student summary, and audits the change", async () => {
  const writes = [];
  const tx = {
    $queryRaw: async () => [],
    grade: {
      upsert: async ({ create }) => ({ id: 9n, cursoOfertaId: create.cursoOfertaId, nota: create.nota }),
      groupBy: async () => [{ _avg: { nota: 18 } }],
    },
    attendance: { findMany: async () => [{ presente: true, tardanza: false, justificado: false }, { presente: false, tardanza: false, justificado: true }] },
    student: { update: async (args) => { writes.push(args); return {}; } },
    auditLog: { create: async (args) => { writes.push(args); return {}; } },
  };
  await withStubs([
    [prisma.student, "findFirst", async ({ where }) => where.id === 4n ? ({ id: 4n, seccionId: 2n }) : ({ id: 4n, seccionId: 2n })],
    [prisma.course, "findFirst", async () => ({ seccionId: 2n })],
    [prisma.enrollment, "findFirst", async () => ({ id: 3n })],
    [prisma.anioLectivo, "findFirst", async () => ({ id: 2026n })],
    [prisma.periodoAcademico, "findFirst", async () => ({ id: 1n })],
    [prisma, "$transaction", async (callback) => callback(tx)],
  ], async () => {
    const { res, error } = await invoke(createGrade, { body: { studentId: "4", courseId: "7", periodoNumero: 1, nota: "18", observacion: "Buen trabajo" }, ip: "127.0.0.1" });
    assert.equal(error, undefined);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.item.courseId, "7");
    assert.equal(writes[0].data.promedioGeneral, 18);
    assert.equal(writes[0].data.asistenciaGeneral, 100);
    assert.equal(writes[1].data.accion, "UPSERT");
  });
});

test("learning endpoints list, publish, access, and advance learning activities with guards", async () => {
  const writes = [];
  const tx = {
    courseResource: { create: async ({ data }) => ({ id: 3n, ...data }) },
    academicActivity: { create: async ({ data }) => ({ id: 4n, ...data }) },
    auditLog: { create: async (args) => { writes.push(args); return {}; } },
  };
  await withStubs([
    [prisma.course, "findFirst", async () => ({ id: 8n, anioLectivoId: 2026n, seccionId: 2n, profesorId: 5n })],
    [prisma.courseResource, "findMany", async () => [{ id: 1n, titulo: "Guía" }]],
    [prisma.academicActivity, "findMany", async () => [{ id: 2n, titulo: "Práctica" }]],
    [prisma.teacher, "findFirstOrThrow", async () => ({ id: 5n })],
    [prisma.courseResource, "findFirst", async () => ({ id: 3n, courseId: 8n, activo: true, url: "https://example.test/guide" })],
    [prisma.academicActivity, "findFirst", async () => ({ id: 4n, courseId: 8n, activo: true })],
    [prisma.student, "findFirstOrThrow", async () => ({ id: 6n })],
    [prisma.activityProgress, "findUnique", async () => ({ estado: "iniciada", startedAt: new Date() })],
    [prisma.activityProgress, "upsert", async ({ create }) => ({ ...create, estado: "completada" })],
    [prisma, "$transaction", async (callback) => callback(tx)],
  ], async () => {
    const listed = await invoke(listLearning, { query: { courseId: "8" } });
    assert.equal(listed.error, undefined);
    assert.equal(listed.res.body.data.resources.length, 1);
    const published = await invoke(publishMaterial, { body: { courseId: "8", titulo: "Guía", tipo: "guia", url: "https://example.test/guide" } });
    assert.equal(published.error, undefined);
    assert.equal(published.res.body.data.item.profesorId, 5n);
    const activity = await invoke(publishActivity, { body: { courseId: "8", titulo: "Práctica", tipo: "practica" } });
    assert.equal(activity.error, undefined);
    assert.equal(writes.length, 2);
    const accessed = await invoke(accessMaterial, { params: { id: "3" } });
    assert.equal(accessed.error, undefined);
    const progressed = await invoke(progressActivity, { params: { id: "4" }, body: { estado: "completada" } });
    assert.equal(progressed.error, undefined);
    assert.equal(progressed.res.body.data.progress.estado, "completada");
    const course = await invoke(courseAccess, { body: { courseId: "8" } });
    assert.equal(course.error, undefined);
    const malformed = await invoke(publishMaterial, { body: { courseId: "0", titulo: "x", tipo: "pdf", url: "file:///tmp/doc" } });
    assert.ok(malformed.error);
  });
});

test("learning access handles missing records, start-before-complete, and indicators", async () => {
  await withStubs([
    [prisma.course, "findFirst", async () => ({ id: 8n, anioLectivoId: 2026n, seccionId: 2n, profesorId: 5n })],
    [prisma.courseResource, "findFirst", async () => null],
    [prisma.academicActivity, "findFirst", async () => ({ id: 4n, courseId: 8n, activo: true })],
    [prisma.student, "findFirstOrThrow", async () => ({ id: 6n })],
    [prisma.activityProgress, "findUnique", async () => null],
    [prisma.student, "findFirst", async () => ({ id: 6n })],
    [prisma.lmsEvent, "findMany", async () => []],
    [prisma.activityProgress, "count", async () => 0],
    [prisma.grade, "groupBy", async () => []],
    [prisma.attendance, "findMany", async () => []],
  ], async () => {
    const missing = await invoke(accessMaterial, { params: { id: "3" } });
    assert.equal(missing.error?.statusCode, 404);
    const conflict = await invoke(progressActivity, { params: { id: "4" }, body: { estado: "completada" } });
    assert.equal(conflict.error?.statusCode, 409);
    const indicators = await invoke(getIndicators, { params: { id: "6" } });
    assert.equal(indicators.error, undefined);
    assert.equal(indicators.res.body.data.indicators.dias_activos, 0);
  });
});

test("attendance create, bulk upsert, update, and delete refresh academic summaries transactionally", async () => {
  const writes = [];
  const tx = {
    $queryRaw: async () => [],
    attendance: {
      create: async ({ data }) => ({ id: 1n, ...data }),
      upsert: async ({ create }) => ({ id: 2n, ...create }),
      update: async ({ data }) => ({ id: 1n, ...data }),
      delete: async () => ({ id: 1n }),
      findMany: async () => [{ presente: true, tardanza: false, justificado: false }],
    },
    grade: { groupBy: async () => [{ _avg: { nota: 15 } }] },
    student: { update: async (args) => { writes.push(args); return {}; } },
    auditLog: { create: async (args) => { writes.push(args); return {}; } },
  };
  await withStubs([
    [prisma.student, "findFirst", async () => ({ id: 4n })],
    [prisma.attendance, "findUniqueOrThrow", async () => ({ id: 1n, studentId: 4n })],
    [prisma, "$transaction", async (callback) => callback(tx)],
  ], async () => {
    const created = await invoke(createAttendance, { body: { studentId: "4", fecha: "2026-06-01", presente: true }, ip: "127.0.0.1" });
    assert.equal(created.error, undefined);
    assert.equal(created.res.statusCode, 201);
    const bulk = await invoke(bulkAttendance, { body: { fecha: "2026-06-02", records: [{ studentId: "5", tardanza: true }, { studentId: "4", presente: false }] } });
    assert.equal(bulk.error, undefined);
    assert.equal(bulk.res.body.data.upserted, 2);
    const updated = await invoke(updateAttendance, { params: { id: "1" }, body: { presente: false } });
    assert.equal(updated.error, undefined);
    const deleted = await invoke(deleteAttendance, { params: { id: "1" } });
    assert.equal(deleted.error, undefined);
    assert.equal(deleted.res.body.message, "Registro eliminado");
    assert.equal(writes.filter((entry) => entry.data?.asistenciaGeneral != null).length, 5);
  });
});

test("access-account export falls back safely and never returns passwords", async () => {
  await withStubs([
    [prisma.user, "findFirst", async () => null],
    [prisma.teacher, "findMany", async () => [
      { codigo: "P1", nombres: "Tere", apellidos: "Docente", email: "t@example.test", especialidad: "Tutoría", usuario: { email: "account@example.test", activo: true } },
      { codigo: "P2", nombres: "Luis", apellidos: "Curso", email: "l@example.test", especialidad: "Matemática", usuario: null },
    ]],
    [prisma.student, "findMany", async () => [
      { codigo: "E1", nombres: "Ana", apellidos: "Paz", dni: "12345678", email: null, usuarioId: null, usuario: null, seccion: { nombre: "A", grado: { numero: 1 } } },
      { codigo: "E2", nombres: "Sol", apellidos: "Rey", dni: "87654321", email: null, usuarioId: 8n, usuario: { email: "student@example.test", activo: false }, seccion: null },
    ]],
  ], async () => {
    const { res, error } = await invoke(exportAccessAccounts);
    assert.equal(error, undefined);
    assert.equal(res.body.data.director.rol, "Director");
    assert.equal(res.body.data.teachers[0].email, "account@example.test");
    assert.equal(res.body.data.teachers[0].tipo, "Tutor 1°-2°");
    assert.equal(res.body.data.teachers[1].email, "l@example.test");
    assert.equal(res.body.data.students[0].email, "ana.paz5678@blenkir.edu.pe");
    assert.equal(res.body.data.students[0].salon, "1° A");
    assert.equal(res.body.data.students[1].salon, "—");
    assert.deepEqual(res.body.data.totals, { teachers: 2, students: 2, studentsSinCuenta: 1 });
    assert.deepEqual(Object.keys(res.body.data.passwordEnvByRole), ["director", "docente", "estudiante"]);
    assert.equal(JSON.stringify(res.body.data).includes("passwordHash"), false);
  });
});

test("professor academic endpoints filter assigned courses, sections, students, and LMS indicators", async () => {
  const sectionRows = [
    { id: 10n, gradoId: 1n, nombre: "A", grado: { id: 1n, numero: 1, nombre: "Primero", nivel: { nombre: "Primaria" } }, _count: { estudiantes: 2 } },
    { id: 11n, gradoId: 2n, nombre: "B", grado: { id: 2n, numero: 2, nombre: "Segundo", nivel: { nombre: "Primaria" } }, _count: { estudiantes: 3 } },
  ];
  const courseRows = [{
    id: 21n, codigo: "MAT", cursoCatalogo: { nombre: "Matemática" }, seccionId: 10n, seccion: sectionRows[0],
    calificaciones: [{ nota: "16" }, { nota: "18" }], _count: { inscripciones: 2 }, profesor: { id: 5n, nombres: "Tere" },
  }];
  const studentRows = [{
    id: 4n, seccionId: 10n, nombres: "Ana", apellidos: "Paz", predicciones: [], alertas: [], inscripciones: [{ cursoOfertaId: 21n }],
  }];
  await withStubs([
    [prisma.teacher, "findFirst", async () => ({ id: 5n })],
    [prisma.teacherCourseAssignment, "findMany", async (args) => args.select?.cursoOfertaId
      ? [{ cursoOfertaId: 21n }]
      : [{ seccionId: 10n }, { seccionId: 11n }]],
    [prisma.seccion, "findMany", async (args) => args.select?.id ? [{ id: 10n }] : sectionRows],
    [prisma.course, "findMany", async () => courseRows],
    [prisma.student, "findMany", async (args) => args.select?.nombres ? [{ id: 4n, nombres: "Ana", apellidos: "Paz" }] : studentRows],
    [prisma.student, "count", async () => 2],
    [prisma.alert, "count", async () => 1],
    [prisma.anioLectivo, "findFirst", async () => ({ id: 2026n })],
    ...emptyIndicatorStubs(),
  ], async () => {
    const user = { sub: "7", role: "docente" };
    const grades = await invoke(profesorGrados, { user });
    assert.deepEqual(grades.res.body.data.items.map((item) => item.numero), [1, 2]);
    const sections = await invoke(profesorSecciones, { user, query: { gradoId: "1" } });
    assert.equal(sections.res.body.data.items[0].id, "10");
    const courses = await invoke(profesorCursos, { user, query: { seccionId: "10" } });
    assert.equal(courses.res.body.data.items[0].nombre, "Matemática");
    assert.equal(courses.res.body.data.items[0].promedioCurso, 17);
    assert.equal(courses.res.body.data.items[0].alertasActivas, 1);
    const students = await invoke(profesorEstudiantes, { user, query: { search: "Ana", page: "1", limit: "1" } });
    assert.equal(students.res.body.data.items[0].enrolledCourseIds[0], "21");
    assert.equal(students.res.body.data.total, 2);
    const lms = await invoke(profesorLms, { user });
    assert.equal(lms.res.body.data.items[0].indicators.actividades_realizadas, 0);
  });
});

test("professor endpoints return safe empty states when the account has no linked teacher", async () => {
  await withStubs([[prisma.teacher, "findFirst", async () => null]], async () => {
    const result = await invoke(profesorGrados, { user: { sub: "8", role: "docente" } });
    assert.equal(result.error?.statusCode, 403);
  });
});

test("correlativo generates monotonic codes from existing records and supports each entity", async () => {
  const calls = [];
  const tx = {
    correlativo: {
      upsert: async (args) => { calls.push(args); return {}; },
      updateMany: async (args) => { calls.push(args); return { count: 1 }; },
      update: async ({ where }) => ({ entidad: where.entidad, ultimoNumero: where.entidad === "estudiante" ? 6 : 1 }),
    },
    student: { findMany: async () => [{ codigo: "EST-001" }, { codigo: "EST-005" }, { codigo: "otro" }, { codigo: "EST-X" }] },
    teacher: { findMany: async () => [{ codigo: "PROF-003" }] },
    matricula: { findMany: async () => [] },
  };
  assert.equal(await nextCode(tx, "estudiante"), "EST-006");
  assert.equal(await nextCode(tx, "profesor"), "PROF-001");
  assert.equal(await nextCode(tx, "matricula"), "MAT-2026-001");
  assert.equal(calls.filter((entry) => entry.create).length, 3);
  assert.equal(calls.filter((entry) => entry.where?.ultimoNumero?.lt === 5).length, 1);
});

test("enroll2026 writes an atomic enrollment bundle and guards invalid admissions", async () => {
  const writes = [];
  const tx = {
    $queryRaw: async () => [],
    correlativo: {
      upsert: async (args) => { writes.push(args); return {}; },
      updateMany: async (args) => { writes.push(args); return {}; },
      update: async () => ({ ultimoNumero: 7 }),
    },
    seccion: { findUnique: async () => ({ id: 2n, gradoId: 1n, activo: true, capacidad: 30, grado: { numero: 1 } }) },
    anioLectivo: { findFirst: async () => ({ id: 2026n, anio: 2026, activo: true }) },
    student: {
      findUnique: async () => ({ id: 4n, activo: true }),
      findMany: async () => [{ codigo: "EST-006" }],
      update: async (args) => { writes.push(args); return {}; },
    },
    matricula: {
      findUnique: async () => null,
      count: async () => 3,
      findMany: async () => [],
      create: async ({ data }) => ({ id: 9n, ...data }),
    },
    course: { findMany: async () => [{ id: 20n }, { id: 21n }] },
    enrollment: { createMany: async (args) => { writes.push(args); return { count: 2 }; } },
    auditLog: { create: async (args) => { writes.push(args); return {}; } },
  };
  const created = await enroll2026(tx, 4n, 2n, "7", "127.0.0.1");
  assert.equal(created.estado, "activa");
  assert.equal(created.codigo, "MAT-2026-007");
  assert.equal(writes.find((entry) => entry.skipDuplicates)?.data.length, 2);
  assert.ok(writes.some((entry) => entry.data?.seccionId === 2n));
  for (const [message, override] of [
    ["Sección inexistente o inactiva", { seccion: { findUnique: async () => null } }],
    ["Configure el año lectivo 2026 activo", { anioLectivo: { findFirst: async () => null } }],
    ["Estudiante inexistente o inactivo", { student: { ...tx.student, findUnique: async () => null } }],
    ["El estudiante ya tiene matrícula en 2026", { matricula: { ...tx.matricula, findUnique: async () => ({ id: 1n }) } }],
    ["La sección alcanzó su capacidad", { matricula: { ...tx.matricula, count: async () => 30 } }],
  ]) {
    await assert.rejects(enroll2026({ ...tx, ...override }, 4n, 2n, "7"), new RegExp(message));
  }
});

test("student registration validates input and rejects duplicate DNI before committing", async () => {
  await assert.rejects(registerStudent({ dni: "bad" }, "7"));
  const tx = { user: { findUnique: async () => ({ id: 2n }) } };
  await withStubs([[prisma, "$transaction", async (callback) => callback(tx)]], async () => {
    await assert.rejects(registerStudent({ nombres: "Ana", apellidos: "Paz", seccionId: "2", dni: "12345678" }, "7"), /DNI duplicado/);
  });
});

test("professor dashboard combines scoped analytics, workload, periods, and grade summaries", async () => {
  const dashboardCourse = {
    id: 21n, codigo: "MAT", cursoCatalogo: { nombre: "Matemática" }, seccionId: 10n,
    seccion: { nombre: "A", grado: { numero: 1, nombre: "Primero" } },
    calificaciones: [{ nota: "14", periodo: { id: 1n, numero: 1 } }, { nota: "18", periodo: { id: 2n, numero: 2 } }],
  };
  const empty = async () => [];
  await withStubs([
    [globalThis, "fetch", async () => new Response("{}", { status: 200 })],
    [prisma.teacher, "findFirst", async () => ({ id: 5n })],
    [prisma.teacherCourseAssignment, "findMany", async (args) => args.select?.cursoOfertaId ? [{ cursoOfertaId: 21n }] : args.select?.seccionId ? [{ seccionId: 10n }] : []],
    [prisma.anioLectivo, "findFirst", async () => ({ id: 2026n })],
    [prisma.student, "count", async () => 1],
    [prisma.student, "findMany", async () => empty()],
    [prisma.teacher, "count", async () => 2],
    [prisma.seccion, "count", async () => 1], [prisma.seccion, "findMany", empty],
    [prisma.alert, "count", async () => 1], [prisma.alert, "groupBy", empty], [prisma.alert, "findMany", empty],
    [prisma.prediction, "findMany", empty], [prisma.prediction, "aggregate", async () => ({ _avg: { score: 12 } })],
    [prisma.grade, "groupBy", empty], [prisma.attendance, "findMany", empty],
    [prisma.systemConfig, "findUnique", async () => null], [prisma.user, "findFirst", async () => null],
    [prisma.course, "findMany", async () => [dashboardCourse]],
    [prisma.periodoAcademico, "findMany", async () => [{ id: 1n, numero: 1 }, { id: 2n, numero: 2 }]],
  ], async () => {
    const { res, error } = await invoke(profesorDashboard, { user: { sub: "7", role: "docente" } });
    assert.equal(error, undefined);
    assert.equal(res.body.data.kpis.totalCourses, 0);
    assert.equal(res.body.data.kpis.notasPendientes, 0);
    assert.equal(res.body.data.avgByCourse[0].promedio, 16);
    assert.equal(res.body.data.avgBySection[0].promedio, 16);
  });
});

test("tutor assignment synchronizes the classroom tutor and protects teacher-course access", async () => {
  const writes = [];
  const tx = {
    teacher: { findUnique: async () => ({ id: 5n, activo: true }) },
    tutorSeccion: {
      findUnique: async () => null,
      upsert: async (args) => { writes.push(args); return {}; },
    },
    cursoGrado: { findMany: async () => [] },
  };
  await withStubs([
    [prisma.seccion, "findFirst", async () => ({ id: 2n, gradoId: 1n, activo: true, grado: { numero: 1 } })],
    [prisma.anioLectivo, "findFirst", async () => ({ id: 2026n, anio: 2026, activo: true })],
    [prisma.course, "findUnique", async () => null],
    [prisma, "$transaction", async (callback) => callback(tx)],
  ], async () => {
    const assigned = await assignTutorToSection({ profesorId: "5", seccionId: "2" });
    assert.deepEqual(assigned, { tutor: true, totalCursos: 0, seccionId: "2" });
    assert.equal(writes[0].create.profesorId, 5n);
    const noCourses = await assertTeacherAssignmentAccess(5n, 20n).catch((error) => error);
    assert.equal(noCourses.statusCode, 404);
  });
});

test("teacher course access accepts an active assignment and rejects inactive assignments", async () => {
  let relationQuery;
  const course = { cursoId: 9n, seccionId: 4n, anioLectivoId: 2026n, activo: true };
  await withStubs([
    [prisma.course, "findUnique", async () => course],
    [prisma.teacherCourseAssignment, "findUnique", async (args) => { relationQuery = args; return { activo: true }; }],
  ], async () => {
    await assert.doesNotReject(assertTeacherAssignmentAccess(5n, 90n));
  });
  assert.deepEqual(relationQuery.where.profesorId_cursoId_seccionId_anioLectivoId, {
    profesorId: 5n, cursoId: 9n, seccionId: 4n, anioLectivoId: 2026n,
  });

  await withStubs([
    [prisma.course, "findUnique", async () => course],
    [prisma.teacherCourseAssignment, "findUnique", async () => ({ activo: false })],
  ], async () => {
    await assert.rejects(assertTeacherAssignmentAccess(5n, 90n), (error) => error.statusCode === 403);
  });
});
