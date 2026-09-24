import { readDataset } from "./lib/definitive-dataset-reader.mjs";
import { generateDataset } from "./lib/definitive-operational-generator.mjs";
import { validateDataset, printValidation } from "./lib/definitive-dataset-validation.mjs";
import { executionMode, importDataset, importPhase } from "./lib/definitive-dataset-import.mjs";

// Prisma messages/stacks can embed connection strings, credentials or tokens.
// Only allow-listed, redacted fields are ever printed; process.env is never read here.
function sanitize(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/mysql:\/\/[^\s"'`]+/gi, "[REDACTED_URL]")
    .replace(/\b\w*(?:PASSWORD|PASSWD|SECRET|TOKEN|JWT)\w*\s*[:=]\s*[^\s,;"')\]]+/gi, "[REDACTED_ENV]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/\broot:[^@\s]+@/gi, "root:[REDACTED]@");
}

const field = value => sanitize(String(value ?? "")).slice(0, 400) || "none";

function reportImportError(error, phase) {
  const meta = error && typeof error === "object" && error.meta && typeof error.meta === "object" ? error.meta : {};
  const stack = typeof error?.stack === "string" ? error.stack.split("\n") : [];
  const local = stack.filter(line => /scripts[\\/]/.test(line)).slice(0, 5).map(line => field(line.trim()));
  const lines = [
    `IMPORT_PHASE=${field(phase)}`,
    `IMPORT_ERROR_NAME=${field(error?.name)}`,
    `IMPORT_ERROR_CODE=${field(error?.code)}`,
    `IMPORT_ERROR_MODEL=${field(Array.isArray(meta.modelName) ? meta.modelName.join("|") : meta.modelName)}`,
    `IMPORT_ERROR_TARGET=${field(Array.isArray(meta.target) ? meta.target.join("|") : meta.target)}`,
    `IMPORT_ERROR_MESSAGE=${sanitize(String(error?.message ?? "")).slice(0, 500) || "no message"}`
  ];
  if (local.length) lines.push(`IMPORT_ERROR_STACK=${local.join(" | ")}`);
  console.error(lines.join("\n"));
}

let prisma;
let mode = "DRY_RUN";
let phase = "startup";
try {
  mode = executionMode(process.argv.slice(2), process.env);
  console.log(`MODE=${mode}`);
  phase = "dataset-read";
  const source = readDataset();
  phase = "dataset-generate";
  const dataset = generateDataset(source);
  phase = "dataset-validate";
  printValidation(validateDataset(source, dataset));
  if (mode === "DRY_RUN") {
    console.log("DATABASE_CONNECTIONS=0\nRAILWAY_MUTATED=false\nVERCEL_MUTATED=false\nPRODUCTION_DB_MUTATED=false\nDRY_RUN_OK");
  } else {
    // No dotenv, Prisma client construction, or password access on the default path.
    phase = "password-hashing";
    const { PrismaClient } = await import("@prisma/client");
    const { default: bcrypt } = await import("bcryptjs");
    const hashes = new Map();
    for (const user of dataset.tables.user) hashes.set(user.email, await bcrypt.hash(process.env[user.passwordEnv], 12));
    phase = "db-connect";
    prisma = new PrismaClient();
    phase = "import";
    await importDataset(prisma, source, dataset, hashes);
    console.log("DEFINITIVE_DATASET_IMPORTED=true");
  }
} catch (error) {
  // Prisma exceptions can contain connection details or query inputs.
  if (mode === "EXECUTE") reportImportError(error, phase === "import" ? importPhase() : phase);
  else console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect();
}
