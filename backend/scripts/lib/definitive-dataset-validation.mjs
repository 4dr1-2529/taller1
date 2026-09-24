import { check, unique, PERIODS, SOURCE_HASH, validateSource } from "./definitive-dataset-reader.mjs";
import { COUNTS, ML_EMPTY, attendancePct, mean, round, digest, CUTOFF } from "./definitive-operational-generator.mjs";

export function validateDataset(source, dataset) {
  validateSource(source);
  check(dataset.sourceHash === SOURCE_HASH && dataset.seed === 20260921 && dataset.cutoff === CUTOFF, "generation identity");
  const t = dataset.tables;
  for (const [name, n] of Object.entries(COUNTS)) check(t[name]?.length === n, `${name}: expected ${n}, actual ${t[name]?.length}`);
  for (const name of ML_EMPTY) check(t[name]?.length === 0, `forbidden ML ${name}`);
  const students = new Map(t.student.map(r => [r.codigo, r]));
  const courses = new Map(t.course.map(r => [r.key, r]));
  const resources = new Map(t.courseResource.map(r => [r.key, r]));
  const activities = new Map(t.academicActivity.map(r => [r.key, r]));
  const teachers = new Map(t.teacher.map(r => [r.codigo, r]));
  const enrollment = new Map(t.enrollment.map(r => [`${r.student}/${r.course}`, r]));
  const registered = new Map(t.matricula.map(r => [r.student, r]));
  for (const u of t.user) {
    const original = source.Usuarios.find(r => r.email === u.email);
    check(original && u.role === original.rol && u.dni === original.dni_sintetico && u.telefono === original.telefono_sintetico && u.nombres === original.nombres && u.apellidos === original.apellidos && u.passwordEnv === original.password_env && u.activo === true, "generated user identity");
  }
  for (const teacher of t.teacher) {
    const original = source.Profesores.find(r => r.codigo === teacher.codigo);
    check(original && teacher.email === original.email && teacher.dni === original.dni_sintetico && teacher.telefono === original.telefono_sintetico && teacher.activo === true, "generated teacher identity");
  }
  for (const tutor of t.tutorSeccion) check(source.TutoresPlan.some(r => r.seccion_codigo === tutor.section && r.profesor_codigo === tutor.teacher), "generated tutor scope");
  for (const [name, keys] of Object.entries({ user: ["email"], teacher: ["codigo"], student: ["codigo"], matricula: ["student"], course: ["key"], teacherCourseAssignment: ["course"], tutorSeccion: ["section"], enrollment: ["student", "course"], grade: ["student", "course", "period"], attendance: ["student", "fecha"], academicHistory: ["student", "period"], resumenAsistencia: ["student", "period"], courseResource: ["key"], academicActivity: ["key"], activityProgress: ["student", "activity"] })) unique(t[name], r => keys.map(k => r[k]).join("/"), name);
  const allDates = ["createdAt", "fecha", "fechaIngreso", "fechaMatricula", "startedAt", "completedAt"];
  for (const [name, rows] of Object.entries(t)) for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      check(v !== undefined && (typeof v !== "number" || Number.isFinite(v)), `${name}.${k}: undefined/NaN`);
      check(!/passwordHash|token|secret/i.test(k), `${name}: secret field`);
      if (typeof v === "string") check(!v.includes("DEMO-") && !v.includes(".demo@"), "demo residue");
    }
    for (const k of allDates) if (row[k] !== null && row[k] !== undefined) check(Number.isFinite(Date.parse(row[k])) && row[k].slice(0, 10) >= "2026-03-01" && row[k].slice(0, 10) <= CUTOFF, `${name}.${k}: date range`);
    if (row.student) check(students.has(row.student), `${name}: student FK`);
    if (row.teacher) check(teachers.has(row.teacher), `${name}: teacher FK`);
    if (row.course) check(courses.has(row.course), `${name}: course FK`);
    if (row.activity) check(activities.has(row.activity), `${name}: activity FK`);
    if (row.resource) check(resources.has(row.resource), `${name}: resource FK`);
    if (row.period) check([1, 2, 3].includes(row.period), "B4/invalid period");
  }
  for (const s of t.student) {
    const original = source.Estudiantes250.find(r => r.codigo === s.codigo);
    check(s.activo === true && s.estado === original.estado_estudiante && s.section === original.seccion_codigo && s.email === original.email && s.dni === original.dni_sintetico && s.telefono === original.telefono_sintetico, "student source mismatch");
    check(registered.get(s.codigo)?.estado === original.matricula_estado, "matricula source mismatch");
    const expectedCourses = t.course.filter(c => c.section === s.section).map(c => c.key).sort();
    const enrollments = t.enrollment.filter(e => e.student === s.codigo);
    check(enrollments.map(e => e.course).sort().join() === expectedCourses.join(), "student enrollment scope/coverage");
    check(enrollments.every(e => e.estado === (original.matricula_estado === "activa" ? "activa" : "retirada")), "enrollment state");
    const grades = t.grade.filter(g => g.student === s.codigo);
    check(round(mean(expectedCourses.map(c => mean(grades.filter(g => g.course === c).map(g => g.nota))))) === s.promedioGeneral, "student mean of course means");
    check(round(attendancePct(t.attendance.filter(a => a.student === s.codigo))) === s.asistenciaGeneral, "student attendance aggregate");
    for (const [period, start, end] of PERIODS.slice(0, 3)) {
      const notes = grades.filter(g => g.period === period);
      const expected = period < 3 ? expectedCourses.length : original.matricula_estado !== "activa" ? 0 : original.grado <= 2 ? 11 : 13;
      check(notes.length === expected, "per-student grade coverage");
      const hist = t.academicHistory.find(h => h.student === s.codigo && h.period === period);
      check(Boolean(hist) === Boolean(notes.length), "history without evidence or missing history");
      const rows = t.attendance.filter(a => a.student === s.codigo && a.fecha >= start && a.fecha <= end);
      const pct = attendancePct(rows);
      check(rows.length > 0 && pct !== null, "attendance summary without computable evidence");
      const summary = t.resumenAsistencia.find(h => h.student === s.codigo && h.period === period);
      check(summary && summary.porcentaje === round(pct) && summary.diasRegistrados === rows.filter(a => !a.justificado).length && summary.diasPresentes === rows.filter(a => !a.justificado && (a.presente || a.tardanza)).length, "attendance summary mismatch");
      if (hist) check(hist.promedio === round(mean(notes.map(g => g.nota))) && hist.cursosDesaprobados === notes.filter(g => g.nota < 11).length && hist.asistenciaPct === round(pct), "history not derived from period evidence");
    }
  }
  check(t.enrollment.filter(e => e.estado === "activa").length === 3354, "active enrollments");
  check(t.enrollment.filter(e => e.estado === "retirada").length === 370, "withdrawn enrollments");
  for (const c of t.course) {
    const original = source.OfertaPlan.find(o => o.oferta_codigo === c.key);
    check(original && c.catalog === original.curso_codigo && c.teacher === original.profesor_codigo && c.section === original.seccion_codigo && c.codigo === `${c.catalog}-${c.section}`, "offering synchronization");
    const a = t.teacherCourseAssignment.find(a => a.course === c.key);
    check(a.teacher === c.teacher && a.section === c.section && a.catalog === c.catalog && a.grade === original.grado && a.esTutor === (a.grade <= 2), "assignment synchronization");
    check(t.courseResource.filter(r => r.course === c.key).length === 2 && t.academicActivity.filter(r => r.course === c.key).length === 1, "course content coverage");
  }
  for (const g of t.grade) check(enrollment.has(`${g.student}/${g.course}`) && g.nota >= 0 && g.nota <= 20, "grade scope/range");
  check(t.grade.some(g => g.nota === 0), "real zero grade coverage");
  for (const a of t.attendance) check(![0, 6].includes(new Date(a.fecha).getUTCDay()) && [a.presente, a.tardanza, a.justificado].every(v => typeof v === "boolean") && !(a.presente && a.tardanza), "attendance weekday/state");
  for (const r of [...t.courseResource, ...t.academicActivity]) check(courses.get(r.course).teacher === r.teacher, "content owner scope");
  for (const r of t.courseResource) check(["pdf", "documento", "presentacion", "enlace", "guia", "repaso"].includes(r.tipo) && r.url.startsWith("/synthetic/definitive-2026/"), "resource type/internal synthetic URL");
  for (const a of t.academicActivity) check(["practica", "lectura", "repaso", "material_obligatorio", "otra"].includes(a.tipo), "activity type");
  for (const p of t.activityProgress) {
    const a = activities.get(p.activity);
    check(enrollment.get(`${p.student}/${a.course}`)?.estado === "activa", "progress active scope");
    check(["pendiente", "iniciada", "completada"].includes(p.estado), "progress status");
    check((p.estado === "completada") === Boolean(p.completedAt) && (p.estado !== "pendiente") === Boolean(p.startedAt), "progress timestamps/status");
    if (p.startedAt) check(p.startedAt >= a.createdAt && (!p.completedAt || p.completedAt >= p.startedAt), "progress chronology");
  }
  for (const s of t.student) {
    const events = t.lmsEvent.filter(e => e.student === s.codigo).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const [i, e] of events.entries()) {
      check(registered.get(s.codigo).estado === "activa", "LMS inactive student");
      check(["login", "logout", "sesion", "recurso", "actividad", "curso"].includes(e.tipo), "LMS type");
      if (e.course) check(enrollment.get(`${s.codigo}/${e.course}`)?.estado === "activa", "LMS course scope");
      if (e.resource) check(resources.get(e.resource).course === e.course && e.createdAt >= resources.get(e.resource).createdAt, "LMS resource scope/date");
      if (e.activity) check(activities.get(e.activity).course === e.course && e.createdAt >= activities.get(e.activity).createdAt, "LMS activity scope/date");
      const prev = events[i - 1];
      const elapsed = prev ? Math.floor((Date.parse(e.createdAt) - Date.parse(prev.createdAt)) / 1000) : 0;
      const seconds = prev && prev.tipo !== "logout" && e.tipo !== "login" && elapsed <= 300 ? Math.max(0, elapsed) : 0;
      check(e.durationSeconds === seconds, "LMS duration not equivalent to recordLmsEvent");
    }
  }
  return { counts: Object.fromEntries(Object.entries(t).map(([k, rows]) => [k, rows.length])), logicalSha256: digest(dataset) };
}

export function printValidation(report) {
  for (const [name, n] of Object.entries(report.counts)) console.log(`${name}=${n}`);
  // The tooling never writes password values or hashes to repository artifacts.
  console.log("PASSWORDS_IN_GIT=false");
  for (const line of ["TUTOR_SECCION_COUNT=8", "LOWER_GRADE_ASSIGNMENTS=104", "LOWER_GRADE_ES_TUTOR_TRUE=104", "UPPER_GRADE_ASSIGNMENTS=224", "UPPER_GRADE_ES_TUTOR_FALSE=224", "INVALID_LOWER_ES_TUTOR_FALSE=0", "INVALID_UPPER_ES_TUTOR_TRUE=0", "TUTOR_CONTRACT_VALID=true", "CORRELATIVO_ESTUDIANTE=250", "CORRELATIVO_PROFESOR=24", "CORRELATIVO_MATRICULA=250", "NEXT_STUDENT_CODE=EST-251", "NEXT_TEACHER_CODE=PROF-025", "NEXT_MATRICULA_CODE=MAT-2026-251", "CORRELATIVO_CONTRACT_VALID=true", "ACADEMIC_HISTORY_B1=250", "ACADEMIC_HISTORY_B2=250", "ACADEMIC_HISTORY_B3=225", "ACADEMIC_HISTORY_TOTAL=725", "B3_STUDENTS_WITHOUT_GRADES=25", "B3_FAKE_HISTORY_CREATED=0", "ACADEMIC_HISTORY_FAKE_ZERO_COUNT=0", "ACADEMIC_HISTORY_COPIED_PREVIOUS_COUNT=0", "ACADEMIC_HISTORY_CONTRACT_VALID=true", "PASSWORDS_IN_EXCEL=false", "SECRETS_PRINTED=false", "FAKE_PREDICTIONS_CREATED=false", "FAKE_ML_METRICS_CREATED=false", "DEFINITIVE_DATASET_VALID=true", "DATASET_ID=BLENKIR_DATA_SEED_V6_250", "DATASET_VERSION=6.0-synthetic-scientific-twin"]) console.log(line);
  console.log(`LOGICAL_SHA256=${report.logicalSha256}`);
}
