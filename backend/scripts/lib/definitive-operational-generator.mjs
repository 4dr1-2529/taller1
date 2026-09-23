import { createHash } from "node:crypto";
import { check, PERIODS, SOURCE_HASH } from "./definitive-dataset-reader.mjs";

export const CUTOFF = "2026-09-21";
export const COUNTS = { user: 275, teacher: 24, student: 250, matricula: 250, tutorSeccion: 8, teacherCourseAssignment: 328, course: 328, enrollment: 3724, grade: 10209, attendance: 34950, academicHistory: 725, resumenAsistencia: 750, courseResource: 656, academicActivity: 328, activityProgress: 3354, lmsEvent: 4610 };
export const ML_EMPTY = ["prediction", "prediccionFeatureSnapshot", "prediccionFactor", "alert", "aiRecommendation", "mlDataset", "mlEntrenamiento", "mlModelo", "mlMetrica"];
export const round = n => Math.round(n * 100) / 100;
export const mean = a => a.length ? a.reduce((sum, n) => sum + n, 0) / a.length : null;
export function weekdays(start, end) {
  const days = [];
  for (let ms = Date.parse(start); ms <= Date.parse(end); ms += 86400000) {
    const d = new Date(ms);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
export function prng(seed = 20260921) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function digest(data) { return createHash("sha256").update(JSON.stringify(data)).digest("hex"); }

export function generateDataset(source) {
  const random = prng();
  const result = Object.fromEntries([...Object.keys(COUNTS), ...ML_EMPTY].map(k => [k, []]));
  const dates = PERIODS.slice(0, 3).map(([, start, end]) => weekdays(start, end > CUTOFF ? CUTOFF : end));
  check(dates.map(a => a.length).join() === "50,55,36", "calendar day counts");
  result.user = source.Usuarios.map(u => ({ email: u.email, role: u.rol, nombres: u.nombres, apellidos: u.apellidos, dni: u.dni_sintetico, telefono: u.telefono_sintetico, activo: true, passwordEnv: u.password_env }));
  result.teacher = source.Profesores.map(t => ({ codigo: t.codigo, email: t.email, nombres: t.nombres, apellidos: t.apellidos, dni: t.dni_sintetico, telefono: t.telefono_sintetico, especialidad: t.especialidad, activo: true }));
  result.tutorSeccion = source.TutoresPlan.map(t => ({ section: t.seccion_codigo, teacher: t.profesor_codigo }));
  for (const a of source.AsignacionesPlan) {
    // Workbook offering keys identify rows; persisted codes follow syncCourseOffering.
    result.course.push({ key: a.oferta_codigo, codigo: `${a.curso_codigo}-${a.seccion_codigo}`, catalog: a.curso_codigo, section: a.seccion_codigo, teacher: a.profesor_codigo, activo: true });
    result.teacherCourseAssignment.push({ course: a.oferta_codigo, teacher: a.profesor_codigo, catalog: a.curso_codigo, section: a.seccion_codigo, grade: a.grado, esTutor: a.es_tutor, activo: true });
  }
  const resourceTypes = ["pdf", "documento", "presentacion", "enlace", "guia", "repaso"];
  const activityTypes = ["practica", "lectura", "repaso", "material_obligatorio", "otra"];
  for (const [i, c] of result.course.entries()) {
    for (let j = 0; j < 2; j++) result.courseResource.push({ key: `${c.key}-R${j + 1}`, course: c.key, teacher: c.teacher, titulo: `Material sintetico ${j + 1}: ${c.catalog}`, descripcion: "Contenido sintetico para QA; no es evidencia cientifica.", tipo: resourceTypes[(i * 2 + j) % 6], url: `/synthetic/definitive-2026/${c.key}/material-${j + 1}`, activo: true, createdAt: "2026-08-24T13:00:00.000Z" });
    result.academicActivity.push({ key: `${c.key}-A1`, course: c.key, teacher: c.teacher, titulo: `Actividad sintetica: ${c.catalog}`, descripcion: "Actividad de demostracion tecnologica.", tipo: activityTypes[i % 5], activo: true, createdAt: "2026-08-24T13:00:00.000Z" });
  }
  const withdrawn = source.Estudiantes250.filter(s => s.matricula_estado === "retirada");
  const transferred = source.Estudiantes250.filter(s => s.matricula_estado === "trasladada");
  const exitDays = new Map();
  // The five previously specified QA cohorts each contain three withdrawals and two transfers.
  for (let cohort = 0; cohort < 5; cohort++) {
    for (const s of [...withdrawn.slice(cohort * 3, cohort * 3 + 3), ...transferred.slice(cohort * 2, cohort * 2 + 2)]) exitDays.set(s.codigo, [10, 20, 25, 30, 35][cohort]);
  }
  for (const [i, s] of source.Estudiantes250.entries()) {
    const active = s.matricula_estado === "activa";
    const courses = result.course.filter(c => c.section === s.seccion_codigo);
    result.student.push({ codigo: s.codigo, email: s.email, nombres: s.nombres, apellidos: s.apellidos, dni: s.dni_sintetico, telefono: s.telefono_sintetico, section: s.seccion_codigo, estado: s.estado_estudiante, activo: true, fechaIngreso: s.fecha_ingreso });
    result.matricula.push({ student: s.codigo, section: s.seccion_codigo, codigo: `MAT-2026-${String(i + 1).padStart(4, "0")}`, estado: s.matricula_estado, fechaMatricula: s.fecha_ingreso });
    for (const c of courses) result.enrollment.push({ student: s.codigo, course: c.key, estado: active ? "activa" : "retirada", createdAt: "2026-03-02T12:00:00.000Z" });
    for (let period = 1; period <= 3; period++) {
      const evaluated = period < 3 ? courses.length : active ? (s.grado <= 2 ? 11 : 13) : 0;
      // Rotate omitted subjects so partial B3 is not always missing the same courses.
      const selected = [...courses.slice(i % courses.length), ...courses.slice(0, i % courses.length)].slice(0, evaluated);
      for (const c of selected) {
        const noise = (random() + random() + random() - 1.5) * 4;
        const nota = i === 5 && period === 1 && c === selected[0] ? 0 : round(Math.max(0, Math.min(20, s.objetivo_promedio + noise)));
        result.grade.push({ student: s.codigo, course: c.key, period, nota, createdAt: `${period === 1 ? "2026-05-08" : period === 2 ? "2026-07-24" : CUTOFF}T17:00:00.000Z` });
      }
      const attendedDays = period === 3 && !active ? dates[2].slice(0, exitDays.get(s.codigo)) : dates[period - 1];
      for (const [di, fecha] of attendedDays.entries()) {
        const justified = di > 0 && random() < 0.025;
        const present = !justified && random() < s.objetivo_asistencia_pct / 100;
        const late = present && random() < 0.09;
        result.attendance.push({ student: s.codigo, fecha, presente: present && !late, tardanza: late, justificado: justified, createdAt: `${fecha}T17:00:00.000Z` });
      }
    }
  }
  const activeStudents = source.Estudiantes250.filter(s => s.matricula_estado === "activa");
  for (const [i, s] of activeStudents.entries()) {
    const courses = result.course.filter(c => c.section === s.seccion_codigo);
    for (const c of courses) {
      const n = random();
      const estado = n < 0.15 ? "pendiente" : n < 0.3 ? "iniciada" : "completada";
      result.activityProgress.push({ student: s.codigo, activity: `${c.key}-A1`, estado, startedAt: estado === "pendiente" ? null : "2026-09-07T14:00:00.000Z", completedAt: estado === "completada" ? "2026-09-08T15:00:00.000Z" : null });
    }
    const n = 20 + (i < 110 ? 1 : 0);
    for (let j = 0; j < n; j++) {
      const c = courses[j % courses.length];
      const slot = j % 5;
      const tipo = i === 0 ? ["curso", "recurso", "actividad", "sesion", "logout"][slot] : ["login", "curso", "recurso", "actividad", "logout"][slot];
      const createdAt = new Date(Date.UTC(2026, 7, 25 + Math.floor(j / 5) * 5, 14, slot * 3)).toISOString();
      result.lmsEvent.push({ student: s.codigo, tipo, course: ["curso", "recurso", "actividad"].includes(tipo) ? c.key : null, resource: tipo === "recurso" ? `${c.key}-R${1 + (j % 2)}` : null, activity: tipo === "actividad" ? `${c.key}-A1` : null, durationSeconds: slot === 0 ? 0 : 180, createdAt });
    }
  }
  for (const s of result.student) {
    const grades = result.grade.filter(g => g.student === s.codigo);
    const attendance = result.attendance.filter(a => a.student === s.codigo);
    const courses = [...new Set(grades.map(g => g.course))].sort();
    s.promedioGeneral = round(mean(courses.map(c => mean(grades.filter(g => g.course === c).map(g => g.nota)))));
    s.asistenciaGeneral = round(attendancePct(attendance));
    for (const [period, start, end] of PERIODS.slice(0, 3)) {
      const rows = attendance.filter(a => a.fecha >= start && a.fecha <= end);
      const computable = rows.filter(a => !a.justificado);
      check(rows.length > 0 && computable.length > 0, `${s.codigo} period ${period}: no computable attendance; cannot persist fictional zero`);
      const pct = round(attendancePct(rows));
      result.resumenAsistencia.push({ student: s.codigo, period, diasRegistrados: computable.length, diasPresentes: computable.filter(a => a.presente || a.tardanza).length, porcentaje: pct });
      const notes = grades.filter(g => g.period === period);
      if (notes.length) result.academicHistory.push({ student: s.codigo, period, promedio: round(mean(notes.map(g => g.nota))), cursosDesaprobados: notes.filter(g => g.nota < 11).length, asistenciaPct: pct });
    }
  }
  return { sourceHash: SOURCE_HASH, seed: 20260921, cutoff: CUTOFF, tables: result };
}

export function attendancePct(rows) {
  const a = rows.filter(r => !r.justificado);
  return a.length ? 100 * a.filter(r => r.presente || r.tardanza).length / a.length : null;
}
