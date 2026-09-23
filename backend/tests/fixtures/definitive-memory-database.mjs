import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { PERIODS } from "../../scripts/lib/definitive-dataset-reader.mjs";

// Test double only: validates Prisma scalar names/types and FK ordering, never opens a connection.
export function memoryDatabase(source, failModel) {
  const id = i => BigInt(i + 1);
  const models = new Map(Prisma.dmmf.datamodel.models.map(m => [m.name[0].toLowerCase() + m.name.slice(1), m]));
  let rows = Object.fromEntries([...models.keys()].map(k => [k, []]));
  rows.institucion = [{ id: 1n, codigo: "BLENKIR" }];
  rows.anioLectivo = [{ id: 1n, institucionId: 1n, anio: 2026, activo: true, fechaInicio: new Date("2026-03-01"), fechaFin: new Date("2026-12-15") }];
  rows.periodoAcademico = PERIODS.map(([numero, start, end, activo], i) => ({ id: id(i), anioLectivoId: 1n, numero, fechaInicio: new Date(start), fechaFin: new Date(end), activo }));
  rows.nivelEducativo = [{ id: 1n, codigo: "primaria" }];
  rows.grado = Array.from({ length: 6 }, (_, i) => ({ id: id(i), nivelId: 1n, numero: i + 1, nivel: rows.nivelEducativo[0] }));
  rows.seccion = source.Secciones.map((s, i) => ({ id: id(i), gradoId: BigInt(s.grado), nombre: s.seccion, capacidad: 30, activo: true, grado: rows.grado[s.grado - 1] }));
  rows.areaCurricular = [...new Set(source.CatalogoCursos.map(c => c.area_codigo))].map((codigo, i) => ({ id: id(i), codigo }));
  rows.cursoCatalogo = source.CatalogoCursos.map((c, i) => ({ id: id(i), codigo: c.curso_codigo, activo: true, areaId: rows.areaCurricular.find(a => a.codigo === c.area_codigo).id, area: rows.areaCurricular.find(a => a.codigo === c.area_codigo) }));
  for (const grade of rows.grado) for (const c of source.CatalogoCursos.filter(c => c.desde_grado <= grade.numero)) {
    const curso = rows.cursoCatalogo.find(r => r.codigo === c.curso_codigo);
    rows.cursoGrado.push({ id: id(rows.cursoGrado.length), gradoId: grade.id, cursoId: curso.id, grado: grade, curso });
  }
  const perms = ["admin.full", "estudiantes.read", "estudiantes.write", "notas.write", "asistencia.write", "alertas.manage", "ia.predict", "reportes.export", "mensajes.send"];
  rows.permission = perms.map((codigo, i) => ({ id: id(i), codigo }));
  rows.role = ["admin", "docente", "estudiante"].map((codigo, i) => {
    const allowed = codigo === "admin" ? perms : codigo === "docente" ? perms.filter(p => p !== "admin.full" && p !== "estudiantes.write") : ["estudiantes.read", "mensajes.send"];
    return { id: id(i), codigo, permisos: allowed.map(p => ({ permiso: rows.permission.find(r => r.codigo === p) })) };
  });
  rows.rolePermission = rows.role.flatMap(r => r.permisos.map(p => ({ rolId: r.id, permisoId: p.permiso.id })));
  rows.mlFeatureDef = source.MLFeatures.map((f, i) => ({ id: id(i), codigo: f.codigo, orden: f.orden, tipoDato: f.tipo_dato, rangoMin: f.rango_min, rangoMax: f.rango_max }));
  rows.correlativo = source.CorrelativosFinales.map(r => ({ entidad: r.entidad, prefijo: r.prefijo, ultimoNumero: 0 }));
  rows.mensajeSala = [{ id: 1n, roomId: "global-institucion", alcance: "global" }, { id: 2n, roomId: "profesores-interno", alcance: "profesores" }];
  const matches = (row, where = {}) => Object.entries(where).every(([k, v]) => v && typeof v === "object" ? true : row[k] === v);
  const tx = { $queryRaw: async () => [], $queryRawUnsafe: async () => [{ n: 0n }] };
  let writes = 0, committed = false;
  for (const [name, model] of models) {
    const validate = data => {
      for (const [k, value] of Object.entries(data)) {
        const field = model.fields.find(f => f.name === k);
        assert.ok(field && field.kind !== "object", `${name}.${k}: not a scalar field`);
        if (value === null) { assert.equal(field.isRequired, false, `${name}.${k}: required`); continue; }
        assert.notEqual(value, undefined, `${name}.${k}: undefined`);
        if (field.type === "BigInt") assert.equal(typeof value, "bigint", `${name}.${k}`);
        if (field.type === "DateTime") assert.ok(value instanceof Date && Number.isFinite(value.getTime()), `${name}.${k}`);
        if (field.type === "String") assert.equal(typeof value, "string", `${name}.${k}`);
        if (field.type === "Boolean") assert.equal(typeof value, "boolean", `${name}.${k}`);
      }
      for (const field of model.fields.filter(f => f.relationFromFields?.length)) {
        const values = field.relationFromFields.map(k => data[k]);
        if (values.some(v => v === undefined || v === null)) continue;
        const target = field.type[0].toLowerCase() + field.type.slice(1);
        assert.ok(rows[target].some(r => field.relationToFields.every((k, i) => r[k] === values[i])), `${name}.${field.name}: missing FK`);
      }
    };
    tx[name] = {
      count: async ({ where } = {}) => rows[name].filter(r => matches(r, where)).length,
      findMany: async ({ where } = {}) => rows[name].filter(r => matches(r, where)),
      findFirst: async ({ where } = {}) => rows[name].find(r => matches(r, where)) ?? null,
      findUnique: async ({ where }) => rows[name].find(r => matches(r, where)) ?? null,
      create: async ({ data }) => {
        if (name === failModel) throw new Error("INJECTED_WRITE_FAILURE");
        validate(data);
        for (const field of model.fields.filter(f => f.kind !== "object" && f.isRequired && !f.hasDefaultValue && !f.isUpdatedAt && !f.isList)) assert.notEqual(data[field.name], undefined, `${name}.${field.name}: required`);
        const row = { id: id(rows[name].length), ...data };
        rows[name].push(row); writes++;
        return row;
      },
      createMany: async ({ data }) => { for (const row of data) await tx[name].create({ data: row }); return { count: data.length }; },
      update: async ({ where, data }) => {
        validate(data);
        const row = rows[name].find(r => matches(r, where));
        assert.ok(row, `${name}: update target missing`);
        Object.assign(row, data); writes++;
        return row;
      },
    };
  }
  tx.grade.groupBy = async ({ where }) => {
    const notes = rows.grade.filter(r => r.studentId === where.studentId);
    return [...new Set(notes.map(r => r.cursoOfertaId))].map(cursoOfertaId => {
      const values = notes.filter(r => r.cursoOfertaId === cursoOfertaId).map(r => r.nota);
      return { cursoOfertaId, _avg: { nota: values.reduce((a, b) => a + b, 0) / values.length } };
    });
  };
  return {
    get rows() { return rows; }, get writes() { return writes; }, get committed() { return committed; },
    $transaction: async (fn, options) => {
      assert.equal(options.isolationLevel, "Serializable");
      const before = structuredClone(rows);
      try { const result = await fn(tx); committed = true; return result; }
      catch (e) { rows = before; throw e; }
    },
  };
}
