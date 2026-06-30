/**
 * Ejecuta tsx vía Node sin depender de PATH/shell (Sonar: command injection).
 */
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(backendRoot, "package.json"));

export function resolveTsxCli() {
  return require.resolve("tsx/dist/cli.mjs");
}

export function spawnTsx(args, options = {}) {
  return spawn(process.execPath, [resolveTsxCli(), ...args], {
    cwd: backendRoot,
    env: process.env,
    stdio: "inherit",
    ...options,
  });
}

export function spawnTsxSync(args, options = {}) {
  return spawnSync(process.execPath, [resolveTsxCli(), ...args], {
    cwd: backendRoot,
    env: process.env,
    stdio: options.stdio ?? "inherit",
    encoding: options.encoding,
    timeout: options.timeout,
  });
}
