import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../docs/cuentas-demo");
const API_URL = (process.env.API_URL ?? "https://backend-production-fcb1.up.railway.app/api/v1").replace(/\/$/, "");
const DIRECTOR_EMAIL = process.env.DIRECTOR_EMAIL ?? "director@blenkir.edu.pe";
const DIRECTOR_PASSWORD = process.env.DIRECTOR_PASSWORD?.trim() || process.env.DIRECTOR_INITIAL_PASSWORD?.trim();
if (!DIRECTOR_PASSWORD) throw new Error("Defina DIRECTOR_INITIAL_PASSWORD (o DIRECTOR_PASSWORD) en el entorno.");

// Nunca se escribe el valor de una contraseña: los CSV solo referencian el
// nombre de la variable de entorno que corresponde a cada rol.
const TEACHER_PASSWORD_ENV = "TEACHER_INITIAL_PASSWORD";
const STUDENT_PASSWORD_ENV = "STUDENT_INITIAL_PASSWORD";

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

  const teacherCsv = [
    "codigo,tipo,nombres,apellidos,email_login,password_env,especialidad,cuenta_activa",
    ...data.teachers.map((t) =>
      [t.codigo, t.tipo, t.nombres, t.apellidos, t.email, TEACHER_PASSWORD_ENV, t.especialidad, t.cuentaActiva ? "si" : "no"]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");

  const studentCsv = [
    "codigo,salon,nombres,apellidos,email_login,password_env,cuenta_activa",
    ...data.students.map((s) =>
      [s.codigo, s.salon, s.nombres, s.apellidos, s.email, STUDENT_PASSWORD_ENV, s.cuentaActiva ? "si" : "no"]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");

  // Las credenciales jamás se persisten en disco: solo el nombre de la variable.
  const sanitized = {
    ...data,
    password: undefined,
    director: data.director ? { ...data.director, passwordEnv: "DIRECTOR_INITIAL_PASSWORD" } : data.director,
    teachers: data.teachers.map((t) => ({ ...t, passwordEnv: TEACHER_PASSWORD_ENV })),
    students: data.students.map((s) => ({ ...s, passwordEnv: STUDENT_PASSWORD_ENV })),
  };
  delete sanitized.password;

  fs.writeFileSync(path.join(outDir, "profesores.csv"), teacherCsv, "utf8");
  fs.writeFileSync(path.join(outDir, "estudiantes.csv"), studentCsv, "utf8");
  fs.writeFileSync(path.join(outDir, "cuentas.json"), JSON.stringify(sanitized, null, 2), "utf8");

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
