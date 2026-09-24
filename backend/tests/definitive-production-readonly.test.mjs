import { test } from "node:test";
import assert from "node:assert/strict";
import { memoryDatabase } from "./fixtures/definitive-memory-database.mjs";
import { readDataset } from "../scripts/lib/definitive-dataset-reader.mjs";
import { generateDataset } from "../scripts/lib/definitive-operational-generator.mjs";
import { createReadAdapter, productionPreflight, passwordPresence } from "../scripts/lib/definitive-production-readonly.mjs";

const source = readDataset();
function fixture() {
  const db = memoryDatabase(source);
  db.rows.systemConfig.push({ id: 1n, clave: "institucion.nombre", valor: "I.E.P. Blenkir" }, { id: 2n, clave: "anio_lectivo_activo", valor: "2026" });
  db.rows.nivelEducativo[0].nombre = "Educación Primaria";
  for (const c of db.rows.cursoCatalogo) c.nombre = source.CatalogoCursos.find(r => r.curso_codigo === c.codigo).curso_nombre;
  db.readClient.$queryRaw = async strings => {
    assert.match(strings[0], /^SELECT COUNT\(\*\) AS n FROM lms_(actividad_semanal|entrega_tarea|indicador_estudiante)$/);
    return [{ n: 0n }];
  };
  return db;
}

test("production preflight: read adapter cannot expose or acquire write methods", () => {
  const read = createReadAdapter(fixture().readClient);
  for (const method of ["$transaction", "$queryRaw", "$queryRawUnsafe", "$executeRaw", "$executeRawUnsafe", "$extends", "$connect"]) assert.equal(read[method], undefined);
  for (const model of ["user", "correlativo", "course"]) {
    assert.equal(Object.getPrototypeOf(read[model]), null);
    for (const method of ["create", "createMany", "update", "updateMany", "upsert", "delete", "deleteMany"]) {
      assert.equal(read[model][method], undefined);
      assert.throws(() => { read[model][method] = () => {}; }, TypeError);
    }
  }
});
test("production preflight: reads datasource, resolves real supplied IDs and preserves snapshots", async () => {
  const db = fixture();
  const visited = new WeakSet();
  function shift(value) {
    if (!value || typeof value !== "object" || visited.has(value)) return;
    visited.add(value);
    for (const k of Object.keys(value)) if (typeof value[k] === "bigint") value[k] += 4000n; else shift(value[k]);
  }
  shift(db.rows);
  const result = await productionPreflight(createReadAdapter(db.readClient), source);
  assert.ok(result.statistics.successfulReads > 0);
  assert.equal(result.statistics.writes, 0);
  assert.equal(db.writes, 0);
  assert.deepEqual(result.before, result.after);
  assert.equal(result.resolved.offers.length, 328);
  assert.ok(result.resolved.offers.every(o => o.cursoId > 4000n && o.seccionId > 4000n));
  assert.equal(result.validation.counts.academicHistory, 725);
  assert.equal(result.validation.logicalSha256, "18d80a5e2e0813269d15c63c8be95867c58abd34907ace68b9c84c96d57302b0");
});
for (const [name, mutate] of [
  ["population", db => db.rows.user.push({ id: 1n })],
  ["missing section", db => db.rows.seccion.pop()],
  ["wrong feature", db => { db.rows.mlFeatureDef[0].codigo = "unknown"; }],
  ["nonzero counter", db => { db.rows.correlativo[0].ultimoNumero = 1; }],
  ["wrong natural key", db => { db.rows.cursoCatalogo[0].codigo = "unknown"; }],
  ["missing config", db => db.rows.systemConfig.pop()],
]) test(`production preflight: rejects ${name} before generation`, async () => {
  const db = fixture(); mutate(db);
  let generated = false;
  await assert.rejects(productionPreflight(createReadAdapter(db.readClient), source, () => { generated = true; }), /DATASET_INVALID/);
  assert.equal(generated, false);
  assert.equal(db.writes, 0);
});
test("production preflight: detects changed counts and does not declare success", async () => {
  const db = fixture();
  await assert.rejects(productionPreflight(createReadAdapter(db.readClient), source, s => {
    db.rows.user.push({ id: 9000n });
    return generateDataset(s);
  }), /READ_ONLY_GUARD_VIOLATION=true/);
  assert.equal(db.writes, 0);
});
test("production preflight: detects same-count structural alteration", async () => {
  const db = fixture();
  await assert.rejects(productionPreflight(createReadAdapter(db.readClient), source, s => {
    db.rows.correlativo[0].ultimoNumero = 250;
    return generateDataset(s);
  }), /READ_ONLY_GUARD_VIOLATION=true/);
});
test("production preflight: reports only password presence", () => {
  const report = passwordPresence({ DIRECTOR_INITIAL_PASSWORD: "test-value-not-a-credential", STUDENT_INITIAL_PASSWORD: "" });
  assert.deepEqual(report, { DIRECTOR_INITIAL_PASSWORD: "SET", TEACHER_INITIAL_PASSWORD: "MISSING", STUDENT_INITIAL_PASSWORD: "MISSING" });
});
