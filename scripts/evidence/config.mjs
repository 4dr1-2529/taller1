import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

export const BASE_URL = "http://localhost:3029";
export const API_URL = "http://localhost:4000/api/v1";
export const PASSWORD = "mbappe29";

export const USERS = {
  director: { email: "director@blenkir.edu.pe", label: "Director" },
  profesor: { email: "pro50000001@blenkir.edu.pe", label: "Profesor" },
  estudiante: { email: "mateo.quispe0001@blenkir.edu.pe", label: "Alumno" },
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
