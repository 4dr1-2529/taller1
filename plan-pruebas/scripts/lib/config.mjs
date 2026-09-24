import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const PP = join(ROOT, "plan-pruebas");

// Data Seed V5: cada rol usa su propia variable de entorno; nunca un valor literal.
const ENV_BY_ROLE = {
  admin: "DIRECTOR_INITIAL_PASSWORD",
  docente: "TEACHER_INITIAL_PASSWORD",
  estudiante: "STUDENT_INITIAL_PASSWORD",
};
function requirePassword(role) {
  const name = ENV_BY_ROLE[role];
  const value = name ? process.env[name]?.trim() : undefined;
  if (!value) throw new Error(`Defina ${name ?? "la contraseña del rol"} en el entorno.`);
  return value;
}

export const PATHS = {
  root: ROOT,
  planPruebas: PP,
  evidenciasFinales: join(PP, "evidencias-finales"),
  unitEvidencias: join(PP, "pruebas-unitarias/evidencias"),
  cajaNegraEvidencias: join(PP, "pruebas-caja-negra/evidencias"),
  cajaBlancaEvidencias: join(PP, "pruebas-caja-blanca/evidencias"),
  integracionEvidencias: join(PP, "pruebas-integracion/evidencias"),
  rendimientoEvidencias: join(PP, "pruebas-rendimiento/evidencias"),
  seguridadEvidencias: join(PP, "pruebas-seguridad/evidencias"),
  aceptacionEvidencias: join(PP, "pruebas-aceptacion/evidencias"),
  matriz: join(PP, "matriz-pruebas"),
  reporte: join(PP, "qa-results.json"),
};

export const URLS = {
  api: process.env.API_URL ?? "http://localhost:4000/api/v1",
  web: process.env.WEB_URL ?? "http://localhost:3029",
  ml: process.env.ML_URL ?? "http://localhost:5000",
};

export const CREDS = {
  director: { email: "director@blenkir.edu.pe", get password() { return requirePassword("director"); }, role: "admin" },
  profesor: { email: "prof001@blenkir.edu.pe", get password() { return requirePassword("docente"); }, role: "docente" },
  estudiante: { email: "est0002@alumnos.blenkir.edu.pe", get password() { return requirePassword("estudiante"); }, role: "estudiante" },
};
