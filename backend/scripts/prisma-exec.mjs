/**
 * Ejecuta Prisma CLI vía Node (sin shell string — Sonar OS command injection).
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const backendRoot = path.join(__dirname, "..");

const require = createRequire(path.join(backendRoot, "package.json"));

function resolvePrismaCli() {
  const pkg = require.resolve("prisma/package.json");
  return path.join(path.dirname(pkg), "build", "index.js");
}

const prismaCli = resolvePrismaCli();

/**
 * @param {string[]} prismaArgs argumentos CLI de Prisma (sin `prisma`)
 * @param {{ cwd?: string, stdio?: "inherit" | "pipe", encoding?: string }} [options]
 */
export function prismaExec(prismaArgs, options = {}) {
  const { cwd = backendRoot, stdio = "inherit" } = options;
  const encoding = options.encoding ?? (stdio === "pipe" ? "utf8" : undefined);

  return spawnSync(process.execPath, [prismaCli, ...prismaArgs], {
    cwd,
    env: process.env,
    stdio,
    encoding,
  });
}

/**
 * @param {string[]} prismaArgs
 * @param {{ cwd?: string, stdio?: "inherit" | "pipe", encoding?: string }} [options]
 */
export function prismaExecOrThrow(prismaArgs, options = {}) {
  const result = prismaExec(prismaArgs, options);
  if (result.status !== 0) {
    const error = new Error(`prisma ${prismaArgs.join(" ")} → exit ${result.status ?? "signal"}`);
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    error.status = result.status;
    throw error;
  }
  return result;
}
