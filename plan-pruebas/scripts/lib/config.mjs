import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const PP = join(ROOT, "plan-pruebas");

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
  director: { email: "director@blenkir.edu.pe", password: "mbappe29", role: "admin" },
  profesor: { email: "pro50000001@blenkir.edu.pe", password: "mbappe29", role: "docente" },
  estudiante: { email: "mateo.quispe0001@blenkir.edu.pe", password: "mbappe29", role: "estudiante" },
};
