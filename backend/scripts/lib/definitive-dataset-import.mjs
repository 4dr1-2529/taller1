import { check, FEATURES, PERIODS } from "./definitive-dataset-reader.mjs";
import { COUNTS, ML_EMPTY } from "./definitive-operational-generator.mjs";
import { validateDataset } from "./definitive-dataset-validation.mjs";

export function executionMode(args, env) {
  check(args.every(a => a === "--execute" || a === "--dry-run"), "unknown CLI argument");
  check(!(args.includes("--execute") && args.includes("--dry-run")), "conflicting modes");
  if (!args.includes("--execute")) return "DRY_RUN";
  check(env.ALLOW_DEFINITIVE_DATASET_IMPORT === "true" && env.DEFINITIVE_DATASET_EXECUTE === "true" && env.ALLOW_PRODUCTION_DATASET_IMPORT === "true" && env.NODE_ENV === "production", "EXECUTION_NOT_AUTHORIZED");
  for (const key of ["DIRECTOR_INITIAL_PASSWORD", "TEACHER_INITIAL_PASSWORD", "STUDENT_INITIAL_PASSWORD"]) check(typeof env[key] === "string" && env[key].length >= 12, `missing/short ${key}`);
  check(typeof env.DATABASE_URL === "string" && env.DATABASE_URL.startsWith("mysql://"), "DATABASE_URL required for explicit execution");
  return "EXECUTE";
}

const date = value => value.toISOString().slice(0, 10);
const key = (a, b) => `${a}/${b}`;
// Measured sequential round-trip through the Railway SSH tunnel is ~205 ms/query.
// The import performs ~1.000 round-trips (bulk batches + read-backs + per-student summaries),
// so it needs ~210 s plus insert execution. The previous 180 s limit aborted the transaction
// with P2028 before any data problem could occur. 600 s is finite and ~2x the measured need.
const TRANSACTION_TIMEOUT_MS = 600000;
const TRANSACTION_MAX_WAIT_MS = 10000;
const zeroModels = [...Object.keys(COUNTS), ...ML_EMPTY, "session", "notification", "report", "chatMessage", "messageRead", "alertaFactor", "alertaHistorial", "dashboardSnapshot", "horarioClase", "studentApoderado", "apoderado"];

export async function verifyPreseed(tx, source) {
  for (const name of zeroModels) check(await tx[name].count() === 0, `PRESEED_ZERO: ${name}`);
  for (const table of ["lms_actividad_semanal", "lms_entrega_tarea", "lms_indicador_estudiante"]) {
    // Identifiers come exclusively from the fixed allowlist above.
    const [row] = await tx.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM \`${table}\``);
    check(Number(row.n) === 0, `PRESEED_ZERO: ${table}`);
  }
  const structureCounts = { institucion: 1, anioLectivo: 1, periodoAcademico: 4, nivelEducativo: 1, grado: 6, seccion: 22, areaCurricular: 8, cursoCatalogo: 16, cursoGrado: 90, role: 3, permission: 9, rolePermission: 18, mlFeatureDef: 7 };
  for (const [name, n] of Object.entries(structureCounts)) check(await tx[name].count() === n, `structure ${name}`);
  const institution = await tx.institucion.findFirst({ where: { codigo: "BLENKIR" } });
  const year = await tx.anioLectivo.findFirst({ where: { anio: 2026, activo: true } });
  check(institution && year && year.institucionId === institution.id && date(year.fechaInicio) === "2026-03-01" && date(year.fechaFin) === "2026-12-15", "institution/year");
  const periods = await tx.periodoAcademico.findMany({ orderBy: { numero: "asc" } });
  periods.forEach((p, i) => check(p.anioLectivoId === year.id && p.numero === PERIODS[i][0] && date(p.fechaInicio) === PERIODS[i][1] && date(p.fechaFin) === PERIODS[i][2] && p.activo === PERIODS[i][3], "period calendar"));
  const sections = await tx.seccion.findMany({ include: { grado: { include: { nivel: true } } } });
  const sectionMap = new Map(sections.map(s => [`${s.grado.numero}${s.nombre}`, s]));
  for (const s of source.Secciones) {
    const found = sectionMap.get(s.seccion_codigo);
    check(found?.activo && found.capacidad === 30 && found.grado.nivel.codigo === "primaria", "section structure");
  }
  const catalogs = await tx.cursoCatalogo.findMany({ include: { area: true } });
  const catalogMap = new Map(catalogs.map(c => [c.codigo, c]));
  for (const c of source.CatalogoCursos) check(catalogMap.get(c.curso_codigo)?.activo && catalogMap.get(c.curso_codigo).area.codigo === c.area_codigo, "catalog structure");
  const courseGrades = await tx.cursoGrado.findMany({ include: { grado: true, curso: true } });
  const coverage = new Set(courseGrades.map(c => key(c.grado.numero, c.curso.codigo)));
  for (let grade = 1; grade <= 6; grade++) for (const c of source.CatalogoCursos.filter(c => c.desde_grado <= grade)) check(coverage.has(key(grade, c.curso_codigo)), "course/grade structure");
  const roles = await tx.role.findMany({ include: { permisos: { include: { permiso: true } } } });
  const required = { admin: ["admin.full", "estudiantes.read", "estudiantes.write", "notas.write", "asistencia.write", "alertas.manage", "ia.predict", "reportes.export", "mensajes.send"], docente: ["estudiantes.read", "notas.write", "asistencia.write", "alertas.manage", "ia.predict", "reportes.export", "mensajes.send"], estudiante: ["estudiantes.read", "mensajes.send"] };
  for (const [role, permissions] of Object.entries(required)) check(roles.find(r => r.codigo === role)?.permisos.map(p => p.permiso.codigo).sort().join() === permissions.sort().join(), "RBAC structure");
  const features = await tx.mlFeatureDef.findMany({ orderBy: { orden: "asc" } });
  check(features.map(f => f.codigo).join() === FEATURES.join(), "ML feature structure");
  for (const [i, f] of features.entries()) {
    const target = source.MLFeatures[i];
    check(f.orden === target.orden && f.tipoDato === target.tipo_dato && Number(f.rangoMin) === target.rango_min && Number(f.rangoMax) === target.rango_max, "ML feature range/order");
  }
  for (const c of source.CorrelativosFinales) {
    const row = await tx.correlativo.findUnique({ where: { entidad: c.entidad } });
    check(row?.ultimoNumero === 0 && row.prefijo === c.prefijo, "preseed counter");
  }
  const rooms = await tx.mensajeSala.findMany();
  check(rooms.length === 2 && rooms.some(r => r.roomId === "global-institucion" && r.alcance === "global") && rooms.some(r => r.roomId === "profesores-interno" && r.alcance === "profesores"), "institutional rooms");
  return { year, periods: new Map(periods.map(p => [p.numero, p.id])), sections: sectionMap, catalogs: catalogMap, roles: new Map(roles.map(r => [r.codigo, r.id])) };
}

async function batches(tx, name, rows) {
  for (let i = 0; i < rows.length; i += 500) await tx[name].createMany({ data: rows.slice(i, i + 500) });
}

// Tracks the current import step so a failure can be reported without exposing data.
let currentPhase = "idle";
export function importPhase() { return currentPhase; }
const mark = name => { currentPhase = name; };

// Bulk inserts cannot return ids, so ids are read back once and keyed by a unique column.
// Production preseed is verified empty inside this transaction, so the read-back is exactly what we wrote.
async function readBackByKey(tx, name, keyField, expected) {
  const rows = await tx[name].findMany({ orderBy: { id: "asc" } });
  check(rows.length === expected, `bulk read-back count ${name}`);
  const map = new Map();
  for (const row of rows) {
    check(!map.has(row[keyField]), `bulk read-back duplicate ${name}.${keyField}`);
    map.set(row[keyField], row.id);
  }
  return map;
}

// Same read-back, but the natural key is not persisted: position is verified against a stored FK.
async function readBackByPosition(tx, name, expected, verify) {
  const rows = await tx[name].findMany({ orderBy: { id: "asc" } });
  check(rows.length === expected, `bulk read-back count ${name}`);
  rows.forEach((row, i) => verify(row, i));
  return rows;
}

export async function importDataset(prisma, source, dataset, passwordHashes) {
  validateDataset(source, dataset);
  return prisma.$transaction(async tx => {
    // Serializes competing imports before the zero-state check; rollback includes every write.
    mark("lock");
    await tx.$queryRaw`SELECT id FROM anio_lectivo WHERE anio = 2026 FOR UPDATE`;
    mark("preseed");
    const structure = await verifyPreseed(tx, source);
    const t = dataset.tables;
    const createdAt = new Date("2026-03-01T12:00:00.000Z");
    const updatedAt = new Date("2026-09-21T17:00:00.000Z");
    mark("users");
    const userRows = [];
    for (const row of t.user) {
      const { role, passwordEnv, ...data } = row;
      check(["DIRECTOR_INITIAL_PASSWORD", "TEACHER_INITIAL_PASSWORD", "STUDENT_INITIAL_PASSWORD"].includes(passwordEnv), "password reference");
      check(passwordHashes.has(row.email), "missing password hash");
      userRows.push({ ...data, rolId: structure.roles.get(role), passwordHash: passwordHashes.get(row.email), createdAt, updatedAt });
    }
    await batches(tx, "user", userRows);
    const users = await readBackByKey(tx, "user", "email", t.user.length);
    mark("teachers");
    await batches(tx, "teacher", t.teacher.map(row => ({ ...row, usuarioId: users.get(row.email), createdAt })));
    const teachers = await readBackByKey(tx, "teacher", "codigo", t.teacher.length);
    mark("students");
    await batches(tx, "student", t.student.map(row => {
      const { section, fechaIngreso, ...data } = row;
      return { ...data, fechaIngreso: new Date(fechaIngreso), seccionId: structure.sections.get(section).id, usuarioId: users.get(row.email), createdAt, updatedAt };
    }));
    const students = await readBackByKey(tx, "student", "codigo", t.student.length);
    mark("matriculas");
    await batches(tx, "matricula", t.matricula.map(({ student, section, fechaMatricula, ...r }) => ({ ...r, estudianteId: students.get(student), seccionId: structure.sections.get(section).id, anioLectivoId: structure.year.id, fechaMatricula: new Date(fechaMatricula) })));
    mark("tutors");
    await batches(tx, "tutorSeccion", t.tutorSeccion.map(r => ({ seccionId: structure.sections.get(r.section).id, profesorId: teachers.get(r.teacher), anioLectivoId: structure.year.id, activo: true })));
    mark("courses");
    await batches(tx, "course", t.course.map(c => ({ codigo: c.codigo, cursoId: structure.catalogs.get(c.catalog).id, seccionId: structure.sections.get(c.section).id, profesorId: teachers.get(c.teacher), anioLectivoId: structure.year.id, activo: true, createdAt })));
    const codigoToKey = new Map(t.course.map(c => [c.codigo, c.key]));
    const courses = new Map();
    for (const [codigo, id] of await readBackByKey(tx, "course", "codigo", t.course.length)) {
      const offeringKey = codigoToKey.get(codigo);
      check(offeringKey !== undefined, "course offering key");
      courses.set(offeringKey, id);
    }
    check(courses.size === t.course.length, "course offering map");
    mark("teacherAssignments");
    await batches(tx, "teacherCourseAssignment", t.teacherCourseAssignment.map(a => {
      const section = structure.sections.get(a.section);
      return { profesorId: teachers.get(a.teacher), cursoId: structure.catalogs.get(a.catalog).id, gradoId: section.gradoId, seccionId: section.id, anioLectivoId: structure.year.id, cursoOfertaId: courses.get(a.course), esTutor: a.esTutor, activo: true, createdAt, updatedAt };
    }));
    mark("enrollments");
    await batches(tx, "enrollment", t.enrollment.map(r => ({ studentId: students.get(r.student), cursoOfertaId: courses.get(r.course), estado: r.estado, createdAt: new Date(r.createdAt) })));
    mark("resources");
    await batches(tx, "courseResource", t.courseResource.map(r => {
      const { key, course, teacher, createdAt: created, ...data } = r;
      return { ...data, courseId: courses.get(course), profesorId: teachers.get(teacher), createdAt: new Date(created), updatedAt };
    }));
    const resources = new Map();
    const storedResources = await readBackByPosition(tx, "courseResource", t.courseResource.length, (row, i) => check(row.courseId === courses.get(t.courseResource[i].course), "courseResource read-back order"));
    t.courseResource.forEach((r, i) => resources.set(r.key, storedResources[i].id));
    mark("activities");
    await batches(tx, "academicActivity", t.academicActivity.map(r => {
      const { key, course, teacher, createdAt: created, ...data } = r;
      return { ...data, courseId: courses.get(course), profesorId: teachers.get(teacher), createdAt: new Date(created), updatedAt };
    }));
    const activities = new Map();
    const storedActivities = await readBackByPosition(tx, "academicActivity", t.academicActivity.length, (row, i) => check(row.courseId === courses.get(t.academicActivity[i].course), "academicActivity read-back order"));
    t.academicActivity.forEach((r, i) => activities.set(r.key, storedActivities[i].id));
    mark("grades");
    await batches(tx, "grade", t.grade.map(r => ({ studentId: students.get(r.student), cursoOfertaId: courses.get(r.course), periodoId: structure.periods.get(r.period), nota: r.nota, createdAt: new Date(r.createdAt) })));
    mark("attendance");
    await batches(tx, "attendance", t.attendance.map(({ student, fecha, createdAt, ...r }) => ({ ...r, studentId: students.get(student), fecha: new Date(fecha), createdAt: new Date(createdAt) })));
    mark("academicHistory");
    for (const name of ["academicHistory", "resumenAsistencia"]) await batches(tx, name, t[name].map(({ student, period, ...r }) => ({ ...r, studentId: students.get(student), periodoId: structure.periods.get(period), ...(name === "academicHistory" ? { createdAt: updatedAt } : {}) })));
    mark("activityProgress");
    await batches(tx, "activityProgress", t.activityProgress.map(r => ({ studentId: students.get(r.student), activityId: activities.get(r.activity), estado: r.estado, startedAt: r.startedAt ? new Date(r.startedAt) : null, completedAt: r.completedAt ? new Date(r.completedAt) : null, updatedAt })));
    mark("lmsEvents");
    await batches(tx, "lmsEvent", t.lmsEvent.map(r => ({ studentId: students.get(r.student), tipo: r.tipo, courseId: r.course ? courses.get(r.course) : null, resourceId: r.resource ? resources.get(r.resource) : null, activityId: r.activity ? activities.get(r.activity) : null, durationSeconds: r.durationSeconds, createdAt: new Date(r.createdAt) })));
    mark("attendanceSummary");
    for (const [code, id] of students) {
      const summary = await refreshImportedSummary(tx, id);
      const expected = t.student.find(s => s.codigo === code);
      // Compare integer cents: SQL/groupBy ordering can change binary rounding at a half cent.
      check(Math.abs(Math.round(summary.promedioGeneral * 100) - Math.round(expected.promedioGeneral * 100)) <= 1 && summary.asistenciaGeneral === expected.asistenciaGeneral, "POSTCHECK academic summary from stored evidence");
    }
    mark("correlativos");
    for (const c of source.CorrelativosFinales) await tx.correlativo.update({ where: { entidad: c.entidad }, data: { ultimoNumero: c.ultimo_numero, updatedAt } });
    mark("postcheck");
    for (const [name, n] of Object.entries(COUNTS)) check(await tx[name].count() === n, `POSTCHECK ${name}`);
    for (const name of ML_EMPTY) check(await tx[name].count() === 0, `POSTCHECK ${name}`);
    check(await tx.enrollment.count({ where: { estado: "activa" } }) === 3354 && await tx.enrollment.count({ where: { estado: "retirada" } }) === 370, "POSTCHECK enrollment states");
    return { imported: true };
  }, { isolationLevel: "Serializable", timeout: TRANSACTION_TIMEOUT_MS, maxWait: TRANSACTION_MAX_WAIT_MS });
}

// Same queries, formula, and rounding as academic-records.service.refreshAcademicSummary.
export async function refreshImportedSummary(tx, studentId) {
  const grades = await tx.grade.groupBy({ by: ["cursoOfertaId"], where: { studentId, periodo: { anioLectivo: { anio: 2026 } } }, _avg: { nota: true } });
  const attendance = await tx.attendance.findMany({ where: { studentId, fecha: { gte: new Date("2026-01-01"), lt: new Date("2027-01-01") } } });
  const computable = attendance.filter(a => !a.justificado);
  const average = grades.length ? grades.reduce((sum, g) => sum + Number(g._avg.nota), 0) / grades.length : 0;
  const pct = computable.length ? 100 * computable.filter(a => a.presente || a.tardanza).length / computable.length : 0;
  const data = { promedioGeneral: Math.round(average * 100) / 100, asistenciaGeneral: Math.round(pct * 100) / 100 };
  await tx.student.update({ where: { id: studentId }, data });
  return data;
}
