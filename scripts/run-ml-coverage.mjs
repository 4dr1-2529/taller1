import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const machineLearningDir = resolve(projectRoot, "machine-learning");
const candidates = [
  process.env.PYTHON,
  resolve(projectRoot, ".venv", "Scripts", "python.exe"),
  resolve(projectRoot, ".venv", "bin", "python"),
  resolve(projectRoot, "..", ".venv", "Scripts", "python.exe"),
  resolve(projectRoot, "..", ".venv", "bin", "python"),
  "python",
  "python3",
].filter(Boolean);

let python;
for (const candidate of [...new Set(candidates)]) {
  if ((candidate.includes("/") || candidate.includes("\\")) && !existsSync(candidate)) continue;

  const probe = spawnSync(candidate, ["-c", "import coverage, pytest"], {
    cwd: machineLearningDir,
    stdio: "ignore",
    windowsHide: true,
  });
  if (probe.status === 0) {
    python = candidate;
    break;
  }
}

if (!python) {
  console.error("No se encontró Python con coverage y pytest instalados.");
  process.exit(1);
}

function run(args) {
  const result = spawnSync(python, args, {
    cwd: machineLearningDir,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["-m", "coverage", "run", "--branch", "--source=app,train", "-m", "pytest", "tests"]);
run(["-m", "coverage", "xml", "-o", "coverage.xml"]);
run(["-m", "coverage", "report"]);
