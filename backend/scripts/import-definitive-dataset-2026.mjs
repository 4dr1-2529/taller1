import { readDataset } from "./lib/definitive-dataset-reader.mjs";
import { generateDataset } from "./lib/definitive-operational-generator.mjs";
import { validateDataset, printValidation } from "./lib/definitive-dataset-validation.mjs";
import { executionMode, importDataset } from "./lib/definitive-dataset-import.mjs";

let prisma;
let mode = "DRY_RUN";
try {
  mode = executionMode(process.argv.slice(2), process.env);
  console.log(`MODE=${mode}`);
  const source = readDataset();
  const dataset = generateDataset(source);
  printValidation(validateDataset(source, dataset));
  if (mode === "DRY_RUN") {
    console.log("DATABASE_CONNECTIONS=0\nRAILWAY_MUTATED=false\nVERCEL_MUTATED=false\nPRODUCTION_DB_MUTATED=false\nDRY_RUN_OK");
  } else {
    // No dotenv, Prisma client construction, or password access on the default path.
    const { PrismaClient } = await import("@prisma/client");
    const { default: bcrypt } = await import("bcryptjs");
    const hashes = new Map();
    for (const user of dataset.tables.user) hashes.set(user.email, await bcrypt.hash(process.env[user.passwordEnv], 12));
    prisma = new PrismaClient();
    await importDataset(prisma, source, dataset, hashes);
    console.log("DEFINITIVE_DATASET_IMPORTED=true");
  }
} catch (error) {
  // Prisma exceptions can contain connection details or query inputs.
  console.error(mode === "EXECUTE" ? "IMPORT_FAILED: transaction aborted; inspect securely, no success declared." : error.message);
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect();
}
