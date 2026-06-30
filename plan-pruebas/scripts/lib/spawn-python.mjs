/**
 * Ejecuta Python sin shell — requiere PYTHON_EXECUTABLE en entorno (Sonar: command injection).
 */
import { spawnSync } from "node:child_process";

export function resolvePythonExecutable() {
  const fromEnv = process.env.PYTHON_EXECUTABLE?.trim() || process.env.PYTHON?.trim();
  if (!fromEnv) {
    throw new Error("Defina PYTHON_EXECUTABLE para ejecutar scripts Python del pipeline QA.");
  }
  return fromEnv;
}

export function spawnPythonSync(args, options = {}) {
  const python = resolvePythonExecutable();
  return spawnSync(python, args, {
    cwd: options.cwd,
    encoding: options.encoding ?? "utf8",
    timeout: options.timeout ?? 60000,
    env: process.env,
    stdio: options.stdio ?? "pipe",
    shell: false,
  });
}
