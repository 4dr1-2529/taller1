/**
 * Contraseña institucional demo — únicamente desde variables de entorno.
 * Local: definir DEMO_PASSWORD en backend/.env (véase .env.example).
 */
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(backendRoot, ".env") });

export function requireDemoPassword() {
  const value =
    process.env.DEMO_PASSWORD?.trim() ||
    process.env.QA_PASSWORD?.trim() ||
    process.env.INSTITUTION_DEFAULT_PASSWORD?.trim();
  if (!value) {
    throw new Error(
      "Defina DEMO_PASSWORD en el entorno (véase backend/.env.example) para seed y pruebas.",
    );
  }
  return value;
}

export function getDefaultInstitutionPassword() {
  return requireDemoPassword();
}
