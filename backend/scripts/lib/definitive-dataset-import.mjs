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

export async function importDataset(prisma, source, dataset, passwordHashes) {
  validateDataset(source, dataset);
  return prisma.$transaction(async tx => {
    // Serializes competing imports before the zero-state check; rollback includes every write.
    await tx.$queryRaw`SELECT id FROM anio_lectivo WHERE anio = 2026 FOR UPDATE`;
    const structure = await verifyPreseed(tx, source);
    const t = dataset.tables;
    const createdAt = new Date("2026-03-01T12:00:00.000Z");
    const updatedAt = new Date("2026-09-21T17:00:00.000Z");
    const users = new Map();
    for (const row of t.user) {
      const { role, passwordEnv, ...data } = row;
      check(["DIRECTOR_INITIAL_PASSWORD", "TEACHER_INITIAL_PASSWORD", "STUDENT_INITIAL_PASSWORD"].includes(passwordEnv), "password reference");
      check(passwordHashes.has(row.email), "missing password hash");
      const u = await tx.user.create({ data: { ...data, rolId: structure.roles.get(role), passwordHash: passwordHashes.get(row.email), createdAt, updatedAt } });
      users.set(row.email, u.id);
    }
    const teachers = new Map();
    for (const row of t.teacher) { const r = await tx.teacher.create({ data: { ...row, usuarioId: users.get(row.email), createdAt } }); teachers.set(row.codigo, r.id); }
    const students = new Map();
    for (const row of t.student) {
      const { section, fechaIngreso, ...data } = row;
      const r = await tx.student.create({ data: { ...data, fechaIngreso: new Date(fechaIngreso), seccionId: structure.sections.get(section).id, usuarioId: users.get(row.email), createdAt, updatedAt } });
      students.set(row.codigo, r.id);
    }
    await batches(tx, "matricula", t.matricula.map(({ student, section, fechaMatricula, ...r }) => ({ ...r, estudianteId: students.get(student), seccionId: structure.sections.get(section).id, anioLectivoId: structure.year.id, fechaMatricula: new Date(fechaMatricula) })));
    await batches(tx, "tutorSeccion", t.tutorSeccion.map(r => ({ seccionId: structure.sections.get(r.section).id, profesorId: teachers.get(r.teacher), anioLectivoId: structure.year.id, activo: true })));
    const courses = new Map();
    for (const a of t.teacherCourseAssignment) {
      const section = structure.sections.get(a.section);
      const offering = t.course.find(c => c.key === a.course);
      const assignment = await tx.teacherCourseAssignment.create({ data: { profesorId: teachers.get(a.teacher), cursoId: structure.catalogs.get(a.catalog).id, gradoId: section.gradoId, seccionId: section.id, anioLectivoId: structure.year.id, esTutor: a.esTutor, activo: true, createdAt, updatedAt } });
      const c = await tx.course.create({ data: { codigo: offering.codigo, cursoId: assignment.cursoId, seccionId: assignment.seccionId, anioLectivoId: assignment.anioLectivoId, profesorId: assignment.profesorId, activo: true, createdAt } });
      await tx.teacherCourseAssignment.update({ where: { id: assignment.id }, data: { cursoOfertaId: c.id, updatedAt } });
      courses.set(a.course, c.id);
    }
    await batches(tx, "enrollment", t.enrollment.map(r => ({ studentId: students.get(r.student), cursoOfertaId: courses.get(r.course), estado: r.estado, createdAt: new Date(r.createdAt) })));
    const resources = new Map(), activities = new Map();
    for (const [table, map] of [["courseResource", resources], ["academicActivity", activities]]) for (const r of t[table]) {
      const { key: code, course, teacher, createdAt: created, ...data } = r;
      const inserted = await tx[table].create({ data: { ...data, courseId: courses.get(course), profesorId: teachers.get(teacher), createdAt: new Date(created), updatedAt } });
      map.set(code, inserted.id);
    }
    await batches(tx, "grade", t.grade.map(r => ({ studentId: students.get(r.student), cursoOfertaId: courses.get(r.course), periodoId: structure.periods.get(r.period), nota: r.nota, createdAt: new Date(r.createdAt) })));
    await batches(tx, "attendance", t.attendance.map(({ student, fecha, createdAt, ...r }) => ({ ...r, studentId: students.get(student), fecha: new Date(fecha), createdAt: new Date(createdAt) })));
    for (const name of ["academicHistory", "resumenAsistencia"]) await batches(tx, name, t[name].map(({ student, period, ...r }) => ({ ...r, studentId: students.get(student), periodoId: structure.periods.get(period), ...(name === "academicHistory" ? { createdAt: updatedAt } : {}) })));
    await batches(tx, "activityProgress", t.activityProgress.map(r => ({ studentId: students.get(r.student), activityId: activities.get(r.activity), estado: r.estado, startedAt: r.startedAt ? new Date(r.startedAt) : null, completedAt: r.completedAt ? new Date(r.completedAt) : null, updatedAt })));
    await batches(tx, "lmsEvent", t.lmsEvent.map(r => ({ studentId: students.get(r.student), tipo: r.tipo, courseId: r.course ? courses.get(r.course) : null, resourceId: r.resource ? resources.get(r.resource) : null, activityId: r.activity ? activities.get(r.activity) : null, durationSeconds: r.durationSeconds, createdAt: new Date(r.createdAt) })));
    for (const [code, id] of students) {
      const summary = await refreshImportedSummary(tx, id);
      const expected = t.student.find(s => s.codigo === code);
      // Compare integer cents: SQL/groupBy ordering can change binary rounding at a half cent.
      check(Math.abs(Math.round(summary.promedioGeneral * 100) - Math.round(expected.promedioGeneral * 100)) <= 1 && summary.asistenciaGeneral === expected.asistenciaGeneral, "POSTCHECK academic summary from stored evidence");
    }
    for (const c of source.CorrelativosFinales) await tx.correlativo.update({ where: { entidad: c.entidad }, data: { ultimoNumero: c.ultimo_numero, updatedAt } });
    for (const [name, n] of Object.entries(COUNTS)) check(await tx[name].count() === n, `POSTCHECK ${name}`);
    for (const name of ML_EMPTY) check(await tx[name].count() === 0, `POSTCHECK ${name}`);
    check(await tx.enrollment.count({ where: { estado: "activa" } }) === 3354 && await tx.enrollment.count({ where: { estado: "retirada" } }) === 370, "POSTCHECK enrollment states");
    return { imported: true };
  }, { isolationLevel: "Serializable", timeout: 180000, maxWait: 10000 });
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
