import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const relativePath = process.argv[2];
if (!relativePath) throw new Error("Indica el archivo LCOV que se va a normalizar");

const filePath = path.resolve(process.cwd(), relativePath);
const lcov = readFileSync(filePath, "utf8").replace(/^SF:(.*)$/gm, (_, source) => `SF:${source.replaceAll("\\", "/")}`);
writeFileSync(filePath, lcov);
process.stdout.write(`LCOV normalizado: ${path.relative(process.cwd(), filePath)}\n`);
