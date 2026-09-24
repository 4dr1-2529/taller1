import { createHash } from "node:crypto";
import { check, FEATURES, PERIODS } from "./definitive-dataset-reader.mjs";
import { COUNTS, ML_EMPTY, generateDataset } from "./definitive-operational-generator.mjs";
import { validateDataset } from "./definitive-dataset-validation.mjs";

const date = value => value.toISOString().slice(0, 10);
const key = (a, b) => `${a}/${b}`;
export const zeroModels = [...Object.keys(COUNTS), ...ML_EMPTY, "session", "notification", "report", "chatMessage", "messageRead", "alertaFactor", "alertaHistorial", "dashboardSnapshot", "horarioClase", "studentApoderado", "apoderado"];
export const structureModels = ["institucion", "anioLectivo", "periodoAcademico", "nivelEducativo", "grado", "seccion", "areaCurricular", "cursoCatalogo", "cursoGrado", "role", "permission", "rolePermission", "mlFeatureDef", "systemConfig", "mensajeSala", "correlativo"];
const models = [...zeroModels, ...structureModels, "auditLog", "intentoLogin"];
const readMethods = ["findUnique", "findFirst", "findMany", "count"];

export function createReadAdapter(client) {
  const adapter = Object.create(null);
  let queries = 0;
  for (const model of models) {
    const delegate = Object.create(null);
    for (const method of readMethods) delegate[method] = async (...args) => {
      const result = await client[model][method](...args);
      queries++;
      return result;
    };
    adapter[model] = Object.freeze(delegate);
  }
  adapter.legacyCounts = async () => {
    const [a] = await client.$queryRaw`SELECT COUNT(*) AS n FROM lms_actividad_semanal`;
    const [b] = await client.$queryRaw`SELECT COUNT(*) AS n FROM lms_entrega_tarea`;
    const [c] = await client.$queryRaw`SELECT COUNT(*) AS n FROM lms_indicador_estudiante`;
    queries += 3;
    return { lms_actividad_semanal: Number(a.n), lms_entrega_tarea: Number(b.n), lms_indicador_estudiante: Number(c.n) };
  };
  adapter.statistics = () => Object.freeze({ successfulReads: queries, writes: 0 });
  return Object.freeze(adapter);
}

function fingerprint(rows) {
  const normalized = rows.map(row => JSON.stringify(row, (_k, value) => typeof value === "bigint" ? String(value) : value)).sort();
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

export async function snapshot(read) {
  const counts = {};
  for (const model of models) counts[model] = await read[model].count();
  Object.assign(counts, await read.legacyCounts());
  const hashes = {};
  for (const model of structureModels) hashes[model] = fingerprint(await read[model].findMany());
  const counters = (await read.correlativo.findMany()).map(r => ({ entidad: r.entidad, ultimoNumero: r.ultimoNumero })).sort((a, b) => a.entidad.localeCompare(b.entidad));
  return { counts, counters, structureHashes: hashes };
}

export async function verifyPreseed(tx, source) {
  for (const name of zeroModels) check(await tx[name].count() === 0, `PRESEED_ZERO: ${name}`);
  for (const [table, n] of Object.entries(await tx.legacyCounts())) check(n === 0, `PRESEED_ZERO: ${table}`);
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

export async function productionPreflight(read, source, generate = generateDataset, onBefore = () => {}) {
  const before = await snapshot(read);
  onBefore(before);
  const structure = await verifyPreseed(read, source);
  const config = await read.systemConfig.findMany();
  check(config.some(r => r.clave === "institucion.nombre" && r.valor === "I.E.P. Blenkir") && config.some(r => r.clave === "anio_lectivo_activo" && r.valor === "2026"), "SystemConfig expected keys/values");
  const catalogs = await read.cursoCatalogo.findMany();
  for (const c of source.CatalogoCursos) check(catalogs.some(r => r.codigo === c.curso_codigo && r.nombre === c.curso_nombre), "catalog natural code/name");
  const levels = await read.nivelEducativo.findMany();
  check(levels.length === 1 && levels[0].codigo === "primaria" && levels[0].nombre === "Educación Primaria", "level code/name");
  const grades = await read.grado.findMany();
  for (let n = 1; n <= 6; n++) check(grades.some(g => g.numero === n && g.nivelId === levels[0].id), "grade natural key");
  const areas = await read.areaCurricular.findMany();
  check(new Set(areas.map(a => a.codigo)).size === 8, "area natural keys");
  const courseGrades = await read.cursoGrado.findMany();
  const offers = source.OfertaPlan.map(o => {
    const section = structure.sections.get(o.seccion_codigo);
    const catalog = structure.catalogs.get(o.curso_codigo);
    check(section && catalog && section.grado.numero === o.grado, "offering structural FK");
    check(courseGrades.some(cg => cg.gradoId === section.gradoId && cg.cursoId === catalog.id), "offering CursoGrado FK");
    check(areas.some(a => a.id === catalog.areaId && a.codigo === o.area_codigo), "offering area FK");
    return { key: o.oferta_codigo, cursoId: catalog.id, gradoId: section.gradoId, seccionId: section.id, anioLectivoId: structure.year.id };
  });
  check(offers.length === 328, "resolved offering count");
  const dataset = generate(source);
  const validation = validateDataset(source, dataset);
  const after = await snapshot(read);
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("READ_ONLY_GUARD_VIOLATION=true");
  check(read.statistics().successfulReads > 0, "no datasource reads");
  return { before, after, validation, resolved: { offers, roles: structure.roles, periods: structure.periods }, statistics: read.statistics() };
}

export function passwordPresence(env) {
  return Object.fromEntries(["DIRECTOR_INITIAL_PASSWORD", "TEACHER_INITIAL_PASSWORD", "STUDENT_INITIAL_PASSWORD"].map(k => [k, typeof env[k] === "string" && env[k].length > 0 ? "SET" : "MISSING"]));
}
