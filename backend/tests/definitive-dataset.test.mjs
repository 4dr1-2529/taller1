import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readDataset, validateSource } from "../scripts/lib/definitive-dataset-reader.mjs";
import { generateDataset, digest, attendancePct } from "../scripts/lib/definitive-operational-generator.mjs";
import { validateDataset } from "../scripts/lib/definitive-dataset-validation.mjs";
import { executionMode, importDataset } from "../scripts/lib/definitive-dataset-import.mjs";
import { memoryDatabase } from "./fixtures/definitive-memory-database.mjs";

const source = readDataset();
const dataset = generateDataset(source);
test("V5: full counts, scopes, period histories and evidence aggregates", () => {
  const report = validateDataset(source, dataset);
  assert.equal(report.counts.academicHistory, 725);
  assert.equal(report.counts.resumenAsistencia, 750);
  assert.deepEqual([1, 2, 3].map(p => dataset.tables.academicHistory.filter(r => r.period === p).length), [250, 250, 225]);
});
test("V5: deterministic logical dataset", () => assert.equal(digest(generateDataset(readDataset())), digest(dataset)));
test("V5: reject source flags, counter, duplicate identity and bad references", () => {
  for (const mutate of [d => { d.AsignacionesPlan[0].es_tutor = false; }, d => { d.CorrelativosFinales[0].ultimo_numero = 0; }, d => { d.Usuarios[1].dni_sintetico = d.Usuarios[0].dni_sintetico; }, d => { d.OfertaPlan[0].profesor_codigo = "UNKNOWN"; }]) {
    const d = structuredClone(source); mutate(d);
    assert.throws(() => validateSource(d), /DATASET_INVALID/);
  }
});
test("V5: reject fabricated history, altered aggregates, future events, scope bypass", () => {
  for (const mutate of [d => { d.tables.academicHistory[0].promedio = -1; }, d => { d.tables.lmsEvent[0].createdAt = "2027-01-01"; }, d => { d.tables.enrollment[0].estado = "activa"; }, d => { d.tables.grade[0].nota = 21; }, d => { d.tables.prediction.push({}); }]) {
    const d = structuredClone(dataset); mutate(d);
    assert.throws(() => validateDataset(source, d), /DATASET_INVALID/);
  }
});
test("V5: justified-only intervals remain no-data, tardiness counts", () => {
  assert.equal(attendancePct([{ justificado: true, presente: false, tardanza: false }]), null);
  assert.equal(attendancePct([{ justificado: false, presente: false, tardanza: true }]), 100);
});
test("V5: default mode and every missing execution guard prevent mutation", () => {
  const env = { NODE_ENV: "production", ALLOW_DEFINITIVE_DATASET_IMPORT: "true", DEFINITIVE_DATASET_EXECUTE: "true", ALLOW_PRODUCTION_DATASET_IMPORT: "true" };
  assert.equal(executionMode([], env), "DRY_RUN");
  assert.equal(executionMode(["--dry-run"], env), "DRY_RUN");
  for (const k of Object.keys(env)) { const partial = { ...env }; delete partial[k]; assert.throws(() => executionMode(["--execute"], partial), /EXECUTION_NOT_AUTHORIZED/); }
  assert.throws(() => executionMode(["--execute"], env), /PASSWORD/);
  assert.throws(() => executionMode(["--execute", "--dry-run"], env), /conflicting/);
});
test("V5: preseed populated database aborts transaction before any insert", async () => {
  let writes = 0;
  const prisma = { $transaction: async (fn, options) => {
    assert.equal(options.isolationLevel, "Serializable");
    return fn({ $queryRaw: async () => [], user: { count: async () => 1, create: async () => { writes++; } } });
  } };
  await assert.rejects(importDataset(prisma, source, dataset, new Map()), /PRESEED_ZERO/);
  assert.equal(writes, 0);
});
test("V5: dry run child process succeeds without a database or passwords", () => {
  const env = { ...process.env };
  for (const key of ["DATABASE_URL", "DIRECTOR_INITIAL_PASSWORD", "TEACHER_INITIAL_PASSWORD", "STUDENT_INITIAL_PASSWORD", "ALLOW_DEFINITIVE_DATASET_IMPORT", "DEFINITIVE_DATASET_EXECUTE", "ALLOW_PRODUCTION_DATASET_IMPORT"]) delete env[key];
  const child = spawnSync(process.execPath, [fileURLToPath(new URL("../scripts/import-definitive-dataset-2026.mjs", import.meta.url)), "--dry-run"], { env, encoding: "utf8", timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /DATABASE_CONNECTIONS=0/);
  assert.match(child.stdout, /DRY_RUN_OK/);
});
test("V5: equivalence with real backend services using injected database doubles", () => {
  const child = spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(new URL("./fixtures/definitive-domain-equivalence.mjs", import.meta.url))], { encoding: "utf8", timeout: 60000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /DOMAIN_EQUIVALENCE_OK/);
});
test("V5: complete importer payloads match Prisma fields and FK order in memory", async () => {
  const db = memoryDatabase(source);
  const hashes = new Map(source.Usuarios.map(u => [u.email, "test-double-hash-not-a-login-credential"]));
  await importDataset(db, source, dataset, hashes);
  assert.equal(db.committed, true);
  assert.equal(db.rows.academicHistory.length, 725);
  assert.equal(db.rows.lmsEvent.length, 4610);
  assert.deepEqual(db.rows.correlativo.map(r => r.ultimoNumero), [250, 24, 250]);
  const rollback = memoryDatabase(source, "grade");
  await assert.rejects(importDataset(rollback, source, dataset, hashes), /INJECTED_WRITE_FAILURE/);
  assert.ok(rollback.writes > 0);
  assert.equal(rollback.committed, false);
  assert.equal(rollback.rows.user.length, 0);
});
test("V5: transaction budget covers the measured round-trip cost (P2028 regression)", async () => {
  // Production runs through a tunnel measuring ~205 ms per sequential round-trip. The original
  // importer issued ~3.500 sequential creates inside a 180 s transaction, which always exceeded
  // the budget (~719 s) and aborted with P2028 before touching any data.
  const MEASURED_MS_PER_ROUND_TRIP = 300;
  const db = memoryDatabase(source);
  const hashes = new Map(source.Usuarios.map(u => [u.email, "test-double-hash-not-a-login-credential"]));
  const runTransaction = db.$transaction;
  let roundTrips = 0;
  let timeout;
  db.$transaction = async (fn, options) => {
    timeout = options.timeout;
    assert.equal(options.isolationLevel, "Serializable");
    return runTransaction(async tx => {
      const counted = { $queryRaw: async (...a) => (roundTrips++, tx.$queryRaw(...a)), $queryRawUnsafe: async (...a) => (roundTrips++, tx.$queryRawUnsafe(...a)) };
      for (const [name, delegate] of Object.entries(tx)) {
        if (!delegate || typeof delegate !== "object") continue;
        counted[name] = {};
        for (const [method, call] of Object.entries(delegate)) {
          if (typeof call === "function") counted[name][method] = (...args) => (roundTrips++, call(...args));
        }
      }
      return fn(counted);
    }, options);
  };
  await importDataset(db, source, dataset, hashes);
  assert.equal(db.committed, true);
  assert.ok(roundTrips < 1500, `bulk import must stay under 1.500 round-trips, saw ${roundTrips}`);
  assert.ok(timeout >= roundTrips * MEASURED_MS_PER_ROUND_TRIP, `timeout ${timeout} ms cannot cover ${roundTrips} round-trips at ${MEASURED_MS_PER_ROUND_TRIP} ms each`);
});
