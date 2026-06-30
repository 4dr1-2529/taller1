/** Contraseña institucional demo — solo desde variables de entorno. */
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export function getInstitutionDefaultPassword(): string {
  const value =
    process.env.DEMO_PASSWORD?.trim() ||
    process.env.INSTITUTION_DEFAULT_PASSWORD?.trim();
  if (!value) {
    throw new Error(
      "Configure DEMO_PASSWORD en el entorno (véase backend/.env.example).",
    );
  }
  return value;
}
