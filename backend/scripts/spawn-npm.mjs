/**
 * Ejecuta npm sin shell string (Sonar: OS command injection).
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

export function spawnNpm(args, options = {}) {
  return spawn(NPM, args, {
    env: process.env,
    stdio: "inherit",
    ...options,
  });
}

export function spawnNpmSync(args, options = {}) {
  return spawnSync(NPM, args, {
    env: process.env,
    stdio: options.stdio ?? "inherit",
    encoding: options.encoding,
    timeout: options.timeout,
    cwd: options.cwd,
  });
}
