/**
 * Exporta cuentas REALES desde la API de producción (Railway).
 */
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../docs/cuentas-demo");
const API_URL = (process.env.API_URL ?? "https://taller1-production.up.railway.app/api/v1").replace(/\/$/, "");
const DIRECTOR_EMAIL = process.env.DIRECTOR_EMAIL ?? "director@blenkir.edu.pe";
const DIRECTOR_PASSWORD = process.env.DIRECTOR_PASSWORD ?? "mbappe29";
const PASSWORD = DIRECTOR_PASSWORD;

function apiRequest(pathname, method, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${pathname}`);
    const payload = body ? JSON.stringify(body) : undefined;
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
              reject(new Error(parsed.message ?? `HTTP ${res.statusCode}`));
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

async function fetchAllStudents(token) {
  const items = [];
  let page = 1;
  let pages = 1;
  do {
    const data = await apiRequest(`/students?page=${page}&limit=200`, "GET", null, token);
    items.push(...(data.items ?? []));
    pages = data.pages ?? 1;
    page++;
  } while (page <= pages);
  return items;
}

async function fetchTeachers(token) {
  const data = await apiRequest("/teachers", "GET", null, token);
  return data.items ?? data.teachers ?? [];
}

function csvEscape(v) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

async function main() {
  console.log(`Exportando desde ${API_URL} …`);

  const login = await apiRequest("/auth/login", "POST", {
    email: DIRECTOR_EMAIL,
    password: DIRECTOR_PASSWORD,
  });

  const token = login.token;
  const teachers = await fetchTeachers(token);
  const students = await fetchAllStudents(token);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: API_URL,
    password: PASSWORD,
    director: { email: DIRECTOR_EMAIL, rol: "Director" },
    teachers: teachers.map((t) => ({
      codigo: t.codigo,
      nombres: t.nombres,
      apellidos: t.apellidos,
      email: t.correo ?? t.email,
      especialidad: t.especialidad,
      tipo: String(t.especialidad ?? "").startsWith("Tutor") ? "Tutor 1°-2°" : "Polidocencia 3°-6°",
      password: PASSWORD,
    })),
    students: students.map((s) => ({
      codigo: s.codigo,
      nombres: s.nombres,
      apellidos: s.apellidos,
      email: s.email,
      loginEmail: s.email,
      salon: s.nivel ?? s.seccion?.grado
        ? `${s.seccion?.grado?.numero ?? ""}° ${s.seccion?.nombre ?? ""}`.trim()
        : "—",
      password: PASSWORD,
    })),
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "cuentas-produccion.json"), JSON.stringify(payload, null, 2), "utf8");

  const teacherCsv = [
    "codigo,tipo,nombres,apellidos,email_login,password,especialidad",
    ...payload.teachers.map((t) =>
      [t.codigo, t.tipo, t.nombres, t.apellidos, t.email, PASSWORD, t.especialidad].map(csvEscape).join(","),
    ),
  ].join("\n");

  const studentCsv = [
    "codigo,salon,nombres,apellidos,email_login,password",
    ...payload.students.map((s) =>
      [s.codigo, s.salon, s.nombres, s.apellidos, s.loginEmail, PASSWORD].map(csvEscape).join(","),
    ),
  ].join("\n");

  fs.writeFileSync(path.join(outDir, "profesores-produccion.csv"), teacherCsv, "utf8");
  fs.writeFileSync(path.join(outDir, "estudiantes-produccion.csv"), studentCsv, "utf8");

  console.log(`OK — ${payload.teachers.length} profesores · ${payload.students.length} estudiantes`);
  console.log(`Archivos en ${outDir} (*-produccion.*)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
