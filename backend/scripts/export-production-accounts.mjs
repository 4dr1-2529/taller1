import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireDemoPassword } from "./demo-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../docs/cuentas-demo");
const API_URL = (process.env.API_URL ?? "https://taller1-production.up.railway.app/api/v1").replace(/\/$/, "");
const DIRECTOR_EMAIL = process.env.DIRECTOR_EMAIL ?? "director@blenkir.edu.pe";
const DIRECTOR_PASSWORD = process.env.DIRECTOR_PASSWORD?.trim() || requireDemoPassword();

function apiRequest(pathname, method, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const url = new URL(`${API_URL}${pathname}`);
    const req = https.request(
      url,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(parsed.message ?? `HTTP ${res.statusCode} en ${pathname}`));
              return;
            }
            if (parsed.success === false) {
              reject(new Error(parsed.message ?? "Error API"));
              return;
            }
            resolve(parsed.data);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function csvEscape(v) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function writeCsvFiles(data) {
  fs.mkdirSync(outDir, { recursive: true });

  const password = data.password ?? DIRECTOR_PASSWORD;

  const teacherCsv = [
    "codigo,tipo,nombres,apellidos,email_login,password,especialidad,cuenta_activa",
    ...data.teachers.map((t) =>
      [t.codigo, t.tipo, t.nombres, t.apellidos, t.email, password, t.especialidad, t.cuentaActiva ? "si" : "no"]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");

  const studentCsv = [
    "codigo,salon,nombres,apellidos,email_login,password,cuenta_activa",
    ...data.students.map((s) =>
      [s.codigo, s.salon, s.nombres, s.apellidos, s.email, password, s.cuentaActiva ? "si" : "no"]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");

  fs.writeFileSync(path.join(outDir, "profesores.csv"), teacherCsv, "utf8");
  fs.writeFileSync(path.join(outDir, "estudiantes.csv"), studentCsv, "utf8");
  fs.writeFileSync(path.join(outDir, "cuentas.json"), JSON.stringify(data, null, 2), "utf8");

  for (const obsolete of [
    "estudiantes-produccion.csv",
    "profesores-produccion.csv",
    "cuentas-produccion.json",
  ]) {
    const p = path.join(outDir, obsolete);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

async function main() {
  console.log(`Exportando cuentas reales desde ${API_URL} …`);

  const login = await apiRequest("/auth/login", "POST", {
    email: DIRECTOR_EMAIL,
    password: DIRECTOR_PASSWORD,
  });

  const token = login.token;
  const data = await apiRequest("/admin/cuentas-acceso", "GET", null, token);

  writeCsvFiles(data);

  console.log(
    `OK — ${data.totals?.teachers ?? data.teachers.length} profesores · ${data.totals?.students ?? data.students.length} estudiantes`,
  );
  if (data.totals?.studentsSinCuenta) {
    console.warn(`  ⚠ ${data.totals.studentsSinCuenta} estudiantes sin cuenta de usuario`);
  }
  console.log(`Archivos: docs/cuentas-demo/estudiantes.csv · profesores.csv`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

export { writeCsvFiles, apiRequest };
