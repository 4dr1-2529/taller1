import { readDataset } from "./lib/definitive-dataset-reader.mjs";
import { generateDataset } from "./lib/definitive-operational-generator.mjs";
import { validateDataset, printValidation } from "./lib/definitive-dataset-validation.mjs";

try {
  const source = readDataset();
  printValidation(validateDataset(source, generateDataset(source)));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
