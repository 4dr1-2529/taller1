import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

export const BASE_URL = "http://localhost:3029";
export const API_URL = "http://localhost:4000/api/v1";

// Data Seed V5: cada rol usa su propia variable de entorno. Nunca un valor literal.
const PASSWORD_BY_ROLE = {
  director: process.env.DIRECTOR_INITIAL_PASSWORD?.trim(),
  profesor: process.env.TEACHER_INITIAL_PASSWORD?.trim(),
  estudiante: process.env.STUDENT_INITIAL_PASSWORD?.trim(),
};
export const PASSWORD = (role) => {
  const value = PASSWORD_BY_ROLE[role];
  if (!value) throw new Error(`Defina la variable de entorno de contraseña para el rol "${role}".`);
  return value;
};

/** Resuelve la contraseña por entorno según el correo (V5: una por rol). */
export const passwordForEmail = (email) => {
  const e = String(email).toLowerCase();
  if (e.startsWith("prof")) return PASSWORD("profesor");
  if (e.startsWith("est") || e.includes("@alumnos.")) return PASSWORD("estudiante");
  return PASSWORD("director");
};

export const USERS = {
  director: { email: "director@blenkir.edu.pe", label: "Director", role: "director" },
  profesor: { email: "prof001@blenkir.edu.pe", label: "Profesor", role: "profesor" },
  estudiante: { email: "est0002@alumnos.blenkir.edu.pe", label: "Alumno", role: "estudiante" },
};

export const OUT = path.join(ROOT, "docs", "evidencias_finales");
export const OUT_CAP = path.join(OUT, "capturas");
export const OUT_DIAG = path.join(OUT, "diagramas");
export const OUT_MET = path.join(OUT, "metricas");
export const OUT_QA = path.join(OUT, "qa");
export const OUT_ARCH = path.join(OUT, "arquitectura");
export const OUT_IA = path.join(OUT, "ia");
export const OUT_DB = path.join(OUT, "base_datos");
export const OUT_API = path.join(OUT, "api");
export const OUT_ISO = path.join(OUT, "iso");

/** También copia selecta a docs/evidencias/ */
export const OUT_LEGACY = path.join(ROOT, "docs", "evidencias");
