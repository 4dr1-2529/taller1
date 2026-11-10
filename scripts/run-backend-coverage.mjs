import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const backendTests = path.join(root, "backend", "tests");
const testFiles = [
  ...readdirSync(backendTests)
    .filter((name) => /^.+\.test\.(?:mjs|ts)$/.test(name))
    .map((name) => path.join("backend", "tests", name)),
  ...readdirSync(path.join(backendTests, "unit"))
    .filter((name) => /^.+\.test\.mjs$/.test(name))
    .map((name) => path.join("backend", "tests", "unit", name)),
].sort();

if (testFiles.length === 0) throw new Error("No se encontraron pruebas de backend");

const c8 = path.join(root, "node_modules", "c8", "bin", "c8.js");
const runRoot = path.join(root, ".tmp", `backend-coverage-${process.pid}`);
const tempRoot = path.resolve(root, ".tmp");
const resolvedRunRoot = path.resolve(runRoot);
if (!resolvedRunRoot.startsWith(`${tempRoot}${path.sep}`)) {
  throw new Error("La carpeta temporal de cobertura debe estar dentro de .tmp");
}
const records = new Map();
let passedTests = 0;

function recordFor(source) {
  let record = records.get(source);
  if (!record) {
    record = {
      functions: new Map(),
      functionHits: new Map(),
      branches: new Map(),
      lines: new Map(),
    };
    records.set(source, record);
  }
  return record;
}

function addReport(reportPath) {
  const lines = readFileSync(reportPath, "utf8").split(/\r?\n/);
  let source;
  let record;
  let includeRecord = false;
  for (const line of lines) {
    if (line.startsWith("SF:")) {
      source = line.slice(3);
      const normalizedSource = source.replaceAll("\\", "/");
      const sourcePath = path.resolve(root, normalizedSource);
      includeRecord = normalizedSource.startsWith("backend/src/") && existsSync(sourcePath);
      record = includeRecord ? recordFor(normalizedSource) : undefined;
    } else if (!record) {
      continue;
    } else if (line.startsWith("FN:")) {
      const value = line.slice(3);
      const comma = value.indexOf(",");
      const start = value.slice(0, comma);
      const name = value.slice(comma + 1);
      if (!record.functions.has(name)) record.functions.set(name, start);
    } else if (line.startsWith("FNDA:")) {
      const value = line.slice(5);
      const comma = value.indexOf(",");
      const hits = Number(value.slice(0, comma));
      const name = value.slice(comma + 1);
      record.functionHits.set(name, (record.functionHits.get(name) ?? 0) + hits);
    } else if (line.startsWith("DA:")) {
      const value = line.slice(3).split(",");
      const number = value[0];
      const hits = Number(value[1]);
      const previous = record.lines.get(number);
      record.lines.set(number, {
        hits: (previous?.hits ?? 0) + hits,
        checksum: previous?.checksum ?? value[2],
      });
    } else if (line.startsWith("BRDA:")) {
      const value = line.slice(5).split(",");
      const key = value.slice(0, 3).join(",");
      const hits = value[3] === "-" ? null : Number(value[3]);
      const previous = record.branches.get(key);
      record.branches.set(key, {
        hits: hits == null && previous == null
          ? null
          : (previous?.hits ?? 0) + (hits ?? 0),
      });
    }
  }
}

function mergedLcov() {
  const output = [];
  let totalLines = 0;
  let hitLines = 0;
  let totalFunctions = 0;
  let hitFunctions = 0;
  let totalBranches = 0;
  let hitBranches = 0;

  for (const [source, record] of records) {
    output.push("TN:", `SF:${source}`);
    for (const [name, start] of record.functions) output.push(`FN:${start},${name}`);
    const functionsFound = record.functions.size;
    const functionsHit = [...record.functions.keys()].filter(
      (name) => (record.functionHits.get(name) ?? 0) > 0,
    ).length;
    totalFunctions += functionsFound;
    hitFunctions += functionsHit;
    output.push(`FNF:${functionsFound}`, `FNH:${functionsHit}`);
    for (const name of record.functions.keys()) {
      output.push(`FNDA:${record.functionHits.get(name) ?? 0},${name}`);
    }

    const branchesFound = record.branches.size;
    const branchesHit = [...record.branches.values()].filter((branch) => (branch.hits ?? 0) > 0).length;
    totalBranches += branchesFound;
    hitBranches += branchesHit;
    for (const [key, branch] of record.branches) {
      output.push(`BRDA:${key},${branch.hits == null ? "-" : branch.hits}`);
    }
    output.push(`BRF:${branchesFound}`, `BRH:${branchesHit}`);

    const linesFound = record.lines.size;
    const linesHit = [...record.lines.values()].filter((line) => line.hits > 0).length;
    totalLines += linesFound;
    hitLines += linesHit;
    for (const [number, line] of record.lines) {
      output.push(`DA:${number},${line.hits}${line.checksum ? `,${line.checksum}` : ""}`);
    }
    output.push(`LF:${linesFound}`, `LH:${linesHit}`, "end_of_record");
  }

  return {
    text: `${output.join("\n")}\n`,
    totals: { hitLines, totalLines, hitFunctions, totalFunctions, hitBranches, totalBranches },
  };
}

rmSync(runRoot, { recursive: true, force: true });
mkdirSync(runRoot, { recursive: true });
try {
  for (let index = 0; index < testFiles.length; index++) {
    const testFile = testFiles[index];
    const reportDir = path.join(runRoot, String(index).padStart(3, "0"));
    const result = spawnSync(process.execPath, [
      c8,
      "--all",
      "--include=backend/src/**",
      "--reporter=lcovonly",
      `--reports-dir=${reportDir}`,
      process.execPath,
      "--import",
      "tsx",
      "--test",
      "--test-concurrency=1",
      testFile,
    ], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
      env: process.env,
    });
    const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    if (result.error || result.status !== 0) {
      process.stderr.write(text);
      throw result.error ?? new Error(`Fallaron las pruebas de ${testFile} (código ${result.status})`);
    }

    const tests = text.match(/ℹ tests (\d+)/)?.[1];
    const failures = Number(text.match(/ℹ fail (\d+)/)?.[1] ?? 0);
    if (!tests || failures !== 0) {
      process.stderr.write(text);
      throw new Error(`No se pudo verificar el resumen de pruebas de ${testFile}`);
    }
    passedTests += Number(tests);
    addReport(path.join(reportDir, "lcov.info"));
    process.stdout.write(`[${index + 1}/${testFiles.length}] ${testFile}: ${tests} pruebas, 0 fallos\n`);
  }

  const report = mergedLcov();
  const outputPath = path.join(root, "coverage", "backend", "lcov.info");
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, report.text);
  const { hitLines, totalLines, hitBranches, totalBranches, hitFunctions, totalFunctions } = report.totals;
  const pct = (hit, total) => total === 0 ? "100.00%" : `${(100 * hit / total).toFixed(2)}%`;
  process.stdout.write(`\nPruebas backend: ${passedTests}/${passedTests}, 0 fallos\n`);
  process.stdout.write(`Líneas: ${hitLines}/${totalLines} ${pct(hitLines, totalLines)}\n`);
  process.stdout.write(`Ramas: ${hitBranches}/${totalBranches} ${pct(hitBranches, totalBranches)}\n`);
  process.stdout.write(`Funciones: ${hitFunctions}/${totalFunctions} ${pct(hitFunctions, totalFunctions)}\n`);
  process.stdout.write(`LCOV combinado: ${path.relative(root, outputPath)}\n`);
} finally {
  rmSync(runRoot, { recursive: true, force: true });
}
