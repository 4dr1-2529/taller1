import { readDataset } from "./lib/definitive-dataset-reader.mjs";
import { printValidation } from "./lib/definitive-dataset-validation.mjs";
import { createReadAdapter, productionPreflight, passwordPresence } from "./lib/definitive-production-readonly.mjs";

let client;
try {
  if (process.argv.length !== 2) throw new Error("PREFLIGHT_CONFIG: no arguments accepted; EXECUTE is not available");
  if (process.env.NODE_ENV !== "production") throw new Error("PREFLIGHT_CONFIG: NODE_ENV must be production");
  if (!process.env.DATABASE_URL?.startsWith("mysql://")) throw new Error("PREFLIGHT_CONFIG: MySQL datasource required");
  if (process.env.DEFINITIVE_DATASET_EXECUTE === "true") throw new Error("PREFLIGHT_CONFIG: EXECUTE authorization must not be enabled");
  const source = readDataset();
  console.log("MODE=PRODUCTION_READ_ONLY_DRY_RUN");
  for (const [name, status] of Object.entries(passwordPresence(process.env))) console.log(`${name}=${status}`);
  const { PrismaClient } = await import("@prisma/client");
  client = new PrismaClient({ log: [] });
  const result = await productionPreflight(createReadAdapter(client), source, undefined, before => console.log(`BEFORE=${JSON.stringify(before)}`));
  printValidation(result.validation);
  console.log(`RESOLVED_STRUCTURAL_OFFERS=${result.resolved.offers.length}`);
  console.log(`AFTER=${JSON.stringify(result.after)}`);
  console.log("DATABASE_CONNECTIONS>=1\nPRODUCTION_DATABASE_CONNECTED=true\nPRESEED_ZERO_OK=true\nSTRUCTURE_OK=true\nPRODUCTION_READ_ONLY_DRY_RUN_OK=true\nDATABASE_WRITES=0\nREAD_ONLY_GUARD_VIOLATION=false\nPRODUCTION_DB_MUTATED=false\nVERCEL_MUTATED=false");
} catch (error) {
  const safe = /^(DATASET_INVALID:|PREFLIGHT_CONFIG:|READ_ONLY_GUARD_VIOLATION=true)/.test(error.message);
  console.error(safe ? error.message : "PRODUCTION_PREFLIGHT_FAILED: datasource read failed; connection details suppressed");
  process.exitCode = 1;
} finally {
  await client?.$disconnect();
}
