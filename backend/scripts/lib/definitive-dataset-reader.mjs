import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import XLSX from "xlsx";

export const SOURCE = fileURLToPath(new URL("../../prisma/data/definitive-2026/BLENKIR_DATASET_DEFINITIVO_2026_CIENTIFICO_SINTETICO_V6.xlsx", import.meta.url));
export const SOURCE_HASH = "0bb7dd701ddc1dd9d14386d7b908ba7238e733e67b522e649da2cab74fcd0a0c";
export const DATASET_ID = "BLENKIR_DATA_SEED_V6_250";
export const DATASET_VERSION = "6.0-synthetic-scientific-twin";
export const FEATURES = ["promedio_general", "cursos_desaprobados", "asistencia_general", "frecuencia_acceso_lms", "tiempo_interaccion_lms", "actividades_realizadas", "recursos_consultados"];
export const PERIODS = [[1, "2026-03-02", "2026-05-08", false], [2, "2026-05-11", "2026-07-24", false], [3, "2026-08-03", "2026-10-09", true], [4, "2026-10-12", "2026-12-15", false]];
export function check(condition, message) { if (!condition) throw new Error(`DATASET_INVALID: ${message}`); }
export function unique(rows, key, name) { check(new Set(rows.map(key)).size === rows.length, `duplicate ${name}`); }
const HEADERS = {
  Director: "email nombres apellidos dni_sintetico telefono_sintetico rol activo password_env",
  Profesores: "codigo nombres apellidos dni_sintetico email telefono_sintetico especialidad activo password_env",
  Estudiantes250: "codigo nombres apellidos dni_sintetico email grado seccion seccion_codigo estado_estudiante matricula_estado objetivo_promedio objetivo_cursos_desaprobados objetivo_asistencia_pct objetivo_frecuencia_lms objetivo_horas_lms_28d objetivo_actividades objetivo_recursos estado_permanencia_observado activo fecha_ingreso telefono_sintetico",
  Secciones: "grado seccion seccion_codigo capacidad estudiantes_dataset",
  CatalogoCursos: "curso_codigo curso_nombre area_codigo desde_grado",
  OfertaPlan: "oferta_codigo curso_codigo curso_nombre area_codigo grado seccion seccion_codigo profesor_codigo anio activo",
  AsignacionesPlan: "profesor_codigo curso_codigo grado seccion seccion_codigo anio oferta_codigo es_tutor activo",
  TutoresPlan: "seccion_codigo profesor_codigo anio activo",
  GeneracionRelacional: "modelo_prisma conteo_objetivo regla validacion",
  MLFeatures: "codigo nombre tipo_dato rango_min rango_max orden",
  ImportConfig: "clave valor descripcion",
  MapeoPrisma: "hoja_excel modelo_prisma regla_importacion",
  Fuentes: "fuente uso url",
  Usuarios: "email rol nombres apellidos dni_sintetico telefono_sintetico activo password_env",
  CorrelativosFinales: "entidad prefijo ultimo_numero validacion",
  AuditoriaCorrecciones: "id severidad hallazgo correccion",
};

export function readDataset(path = SOURCE) {
  // El directorio debe tener un único XLSX activo de datos institucionales (V6).
  // Las versiones legadas (V5 auditado) se conservan solo como referencia histórica
  // y se excluyen explícitamente de esta validación de unicidad.
  const siblings = readdirSync(dirname(path)).filter(n => /\.xlsx$/i.test(n) && !/AUDITADO_V5/i.test(n));
  check(siblings.length === 1, "ambiguous XLSX source directory");
  const bytes = readFileSync(path);
  check(createHash("sha256").update(bytes).digest("hex") === SOURCE_HASH, "DATASET_HASH_MISMATCH");
  const book = XLSX.read(bytes, { type: "buffer", cellDates: false });
  const data = {};
  for (const name of ["README", "Resumen", ...Object.keys(HEADERS)]) {
    check(book.SheetNames.includes(name), `missing sheet ${name}`);
    const matrix = XLSX.utils.sheet_to_json(book.Sheets[name], { header: 1, defval: null });
    if (HEADERS[name]) {
      check(JSON.stringify(matrix[0]) === JSON.stringify(HEADERS[name].split(" ")), `${name}: headers`);
      data[name] = XLSX.utils.sheet_to_json(book.Sheets[name], { defval: null });
    } else data[name] = matrix;
    for (const cell of Object.values(book.Sheets[name])) check(!cell?.f, `${name}: formulas are not allowed`);
  }
  validateSource(data);
  return data;
}

export function validateSource(d) {
  const counts = { Director: 1, Profesores: 24, Estudiantes250: 250, Usuarios: 275, Secciones: 22, CatalogoCursos: 16, OfertaPlan: 328, AsignacionesPlan: 328, TutoresPlan: 8, MLFeatures: 7, CorrelativosFinales: 3 };
  for (const [name, count] of Object.entries(counts)) check(d[name].length === count, `${name}: count`);
  const config = Object.fromEntries(d.ImportConfig.map(r => [r.clave, r.valor]));
  check(config.random_seed === 20260921 && config.cutoff_date === "2026-09-21", "seed/cutoff");
  check(config.dataset_id === DATASET_ID && config.dataset_version === DATASET_VERSION && config.bcrypt_cost === 12, "dataset/password configuration");
  for (const k of ["DIRECTOR_INITIAL_PASSWORD", "TEACHER_INITIAL_PASSWORD", "STUDENT_INITIAL_PASSWORD"]) check(config[k] === "SET_IN_RAILWAY_ENV", "password value in workbook");
  const envs = { admin: "DIRECTOR_INITIAL_PASSWORD", docente: "TEACHER_INITIAL_PASSWORD", estudiante: "STUDENT_INITIAL_PASSWORD" };
  for (const key of ["email", "dni_sintetico", "telefono_sintetico"]) unique(d.Usuarios, r => r[key].toLowerCase(), key);
  for (const u of d.Usuarios) {
    check(typeof u.dni_sintetico === "string" && /^\d{8}$/.test(u.dni_sintetico), "DNI string format");
    check(typeof u.telefono_sintetico === "string" && /^9\d{8}$/.test(u.telefono_sintetico), "phone string format");
    check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email) && !u.email.includes(".demo"), "email format");
    check(u.activo === true && u.password_env === envs[u.rol], "user active/role/password reference");
    check(typeof u.nombres === "string" && u.nombres.length > 0 && u.nombres.length <= 80 && u.apellidos.length > 0 && u.apellidos.length <= 80, "identity length");
  }
  const users = new Map(d.Usuarios.map(u => [u.email, u]));
  for (const [sheet, role] of [["Director", "admin"], ["Profesores", "docente"], ["Estudiantes250", "estudiante"]]) {
    unique(d[sheet], r => r.email, `${sheet} email`);
    for (const r of d[sheet]) {
      const u = users.get(r.email);
      check(u?.rol === role, `${sheet}: user role`);
      for (const k of ["nombres", "apellidos", "dni_sintetico", "telefono_sintetico", "activo"]) check(r[k] === u[k], `${sheet}: identity mismatch ${k}`);
    }
  }
  check(d.Director[0].email === "director@blenkir.edu.pe", "director email");
  d.Profesores.forEach((r, i) => {
    check(r.codigo === `PROF-${String(i + 1).padStart(3, "0")}` && r.email === `prof${String(i + 1).padStart(3, "0")}@blenkir.edu.pe`, "teacher codes/emails");
    check(r.especialidad.length <= 80, "teacher specialty length");
  });
  d.Estudiantes250.forEach((r, i) => {
    check(r.codigo === `EST-${String(i + 1).padStart(4, "0")}` && r.email === `est${String(i + 1).padStart(4, "0")}@alumnos.blenkir.edu.pe`, "student codes/emails");
    check(r.fecha_ingreso === "2026-03-02", "student start date");
    check(["activa", "retirada", "trasladada"].includes(r.matricula_estado), "registration state");
    check(r.estado_estudiante === (r.matricula_estado === "activa" ? "activo" : "retirado"), "student academic state");
    for (const k of Object.keys(r).filter(k => k.startsWith("objetivo_"))) check(typeof r[k] === "number" && Number.isFinite(r[k]) && r[k] >= 0, `invalid objective ${k}`);
    check(r.objetivo_promedio <= 20 && r.objetivo_asistencia_pct <= 100, "objective range");
  });
  for (const [state, n] of [["activa", 225], ["retirada", 15], ["trasladada", 10]]) check(d.Estudiantes250.filter(s => s.matricula_estado === state).length === n, `matricula ${state}`);
  unique(d.Secciones, r => r.seccion_codigo, "section");
  for (const sec of d.Secciones) {
    check(Number.isInteger(sec.grado) && sec.grado >= 1 && sec.grado <= 6 && (sec.grado <= 4 ? "ABCD" : "ABC").includes(sec.seccion), "section grade/name");
    check(sec.seccion_codigo === `${sec.grado}${sec.seccion}` && sec.capacidad === 30, "section identity/capacity");
    const expected = sec.grado <= 4 && "AB".includes(sec.seccion) ? 12 : 11;
    const members = d.Estudiantes250.filter(s => s.seccion_codigo === sec.seccion_codigo);
    check(members.length === expected && sec.estudiantes_dataset === expected, "section distribution");
    check(members.every(s => s.grado === sec.grado && s.seccion === sec.seccion), "student section reference");
  }
  unique(d.CatalogoCursos, r => r.curso_codigo, "catalog");
  unique(d.OfertaPlan, r => r.oferta_codigo, "offering");
  unique(d.AsignacionesPlan, r => r.oferta_codigo, "assignment offering");
  const teachers = new Set(d.Profesores.map(r => r.codigo));
  for (const sec of d.Secciones) {
    const courses = d.CatalogoCursos.filter(c => c.desde_grado <= sec.grado).map(c => c.curso_codigo).sort();
    const offers = d.OfertaPlan.filter(o => o.seccion_codigo === sec.seccion_codigo);
    check(JSON.stringify(offers.map(o => o.curso_codigo).sort()) === JSON.stringify(courses), "course by grade coverage");
  }
  for (const o of d.OfertaPlan) {
    const a = d.AsignacionesPlan.find(r => r.oferta_codigo === o.oferta_codigo);
    check(a && teachers.has(o.profesor_codigo), "assignment/teacher reference");
    for (const k of ["curso_codigo", "profesor_codigo", "grado", "seccion", "seccion_codigo", "anio", "activo"]) check(a[k] === o[k], `assignment/offering mismatch ${k}`);
    check(o.anio === 2026 && o.activo === true && a.es_tutor === (o.grado <= 2), "assignment tutor/year/state");
  }
  check(d.TutoresPlan.map(r => r.seccion_codigo).sort().join() === "1A,1B,1C,1D,2A,2B,2C,2D", "tutor sections");
  unique(d.TutoresPlan, r => r.profesor_codigo, "classroom tutor");
  for (const t of d.TutoresPlan) check(t.anio === 2026 && t.activo === true && d.AsignacionesPlan.filter(a => a.seccion_codigo === t.seccion_codigo && a.profesor_codigo === t.profesor_codigo && a.es_tutor).length === 13, "classroom tutor coverage");
  for (const t of d.Profesores.slice(8)) {
    const a = d.AsignacionesPlan.filter(a => a.profesor_codigo === t.codigo);
    check(a.length === 14 && a.every(a => a.grado >= 3 && !a.es_tutor) && new Set(a.map(a => a.curso_codigo)).size === 2 && new Set(a.map(a => a.seccion_codigo)).size === 7, "polidocencia");
  }
  const rawLimit = process.env.POLIDOCENCIA_MAX_SALONES;
  const parsedLimit = rawLimit != null && rawLimit !== "" ? Number(rawLimit) : 8;
  const maxSections = Number.isFinite(parsedLimit) ? Math.min(8, Math.max(6, Math.round(parsedLimit))) : 8;
  check(maxSections >= 7, "configured POLIDOCENCIA_MAX_SALONES is below dataset requirement");
  check(d.MLFeatures.map(r => r.codigo).join() === FEATURES.join(), "ML features");
  const counters = { estudiante: ["EST-", 250, "EST-251"], profesor: ["PROF-", 24, "PROF-025"], matricula: ["MAT-2026-", 250, "MAT-2026-251"] };
  unique(d.CorrelativosFinales, r => r.entidad, "counter");
  for (const r of d.CorrelativosFinales) { const c = counters[r.entidad]; check(c && r.prefijo === c[0] && r.ultimo_numero === c[1] && r.validacion.endsWith(c[2]), "counter contract"); }
  check(Number(d.GeneracionRelacional.find(r => r.modelo_prisma === "AcademicHistory")?.conteo_objetivo) === 725, "history contract");
}
