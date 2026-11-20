import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

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
const outputDir = path.join(root, "coverage", "backend");
const tempRoot = path.resolve(root, ".tmp");
const tempDir = path.resolve(tempRoot, `backend-coverage-${process.pid}`);
if (!tempDir.startsWith(`${tempRoot}${path.sep}`)) {
  throw new Error("La carpeta temporal de cobertura debe estar dentro de .tmp");
}

mkdirSync(outputDir, { recursive: true });
mkdirSync(tempDir, { recursive: true });
try {
  const result = spawnSync(process.execPath, [
    c8,
    "--all",
    "--include=backend/src/**",
    "--include=backend/scripts/**",
    "--exclude=**/.pytest_cache/**",
    "--exclude=**/.pytest-tmp-*/**",
    "--exclude=.tmp/**",
    "--exclude=tmp/**",
    `--temp-directory=${tempDir}`,
    "--reporter=lcov",
    "--reporter=text-summary",
    `--reports-dir=${outputDir}`,
    process.execPath,
    "--import",
    "tsx",
    "--test",
    "--test-concurrency=1",
    ...testFiles,
  ], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
    env: process.env,
    windowsHide: true,
  });

  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  process.stdout.write(text);
  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(`Backend coverage terminó con código ${result.status}`);
  }

  const testCounts = [...text.matchAll(/ℹ tests (\d+)/g)];
  const failures = [...text.matchAll(/ℹ fail (\d+)/g)];
  const testCount = Number(testCounts.at(-1)?.[1] ?? 0);
  const failureCount = Number(failures.at(-1)?.[1] ?? 0);
  const lcovPath = path.join(outputDir, "lcov.info");
  if (testCount === 0 || failureCount !== 0 || !existsSync(lcovPath)) {
    throw new Error("No se pudo verificar el resumen de pruebas o el LCOV de backend");
  }
  const lcov = readFileSync(lcovPath, "utf8").replace(/^SF:(.*)$/gm, (_, source) => `SF:${source.replaceAll("\\", "/")}`);
  writeFileSync(lcovPath, lcov);
  process.stdout.write(`Backend coverage: ${testCount} pruebas, 0 fallos; LCOV ${path.relative(root, lcovPath)}\n`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
