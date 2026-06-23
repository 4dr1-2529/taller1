/**
 * Verifica muestra de logins y confirma CSV de cuentas web.
 * Uso: node scripts/verify-production-accounts.mjs
 */
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../docs/cuentas-demo");
const API_URL = (process.env.API_URL ?? "https://taller1-production.up.railway.app/api/v1").replace(/\/$/, "");
const PASSWORD = process.env.INSTITUTION_PASSWORD ?? "mbappe29";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loginRequest(email) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ email, password: PASSWORD });
    const url = new URL(`${API_URL}/auth/login`);
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => {
          data += c;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              ok: Boolean(parsed.success && parsed.data?.token),
              message: parsed.message ?? "",
            });
          } catch {
            resolve({ ok: false, message: "parse error" });
          }
        });
      },
    );
    req.on("error", () => resolve({ ok: false, message: "network error" }));
    req.write(payload);
    req.end();
  });
}

async function verifySample(items, sampleSize = 6) {
  const picks = [items[0], items[Math.floor(items.length / 2)], items[items.length - 1]];
  let i = 0;
  while (picks.length < sampleSize && i < items.length) {
    picks.push(items[i]);
    i += Math.max(1, Math.floor(items.length / sampleSize));
  }
  const unique = [...new Map(picks.filter(Boolean).map((x) => [x.email, x])).values()];

  let ok = 0;
  const failed = [];
  for (const row of unique) {
    const result = await loginRequest(row.email);
    if (result.ok) ok++;
    else failed.push(`${row.email} (${result.message})`);
    await sleep(1200);
  }
  return { tested: unique.length, ok, failed };
}

async function main() {
  const jsonPath = path.join(outDir, "cuentas.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("Falta cuentas.json — ejecute: npm run export:accounts:web");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  console.log(`Verificando logins en ${API_URL} (pausa anti-bloqueo)…`);

  await sleep(3000);

  const director = await loginRequest(data.director?.email ?? "director@blenkir.edu.pe");
  console.log(`  Director: ${director.ok ? "OK" : director.message}`);

  const teacherCheck = await verifySample(data.teachers, 5);
  const studentCheck = await verifySample(data.students, 5);

  console.log(`  Profesores: ${teacherCheck.ok}/${teacherCheck.tested} OK`);
  console.log(`  Estudiantes: ${studentCheck.ok}/${studentCheck.tested} OK`);

  if (teacherCheck.failed.length) console.warn("  Profesores fallidos:", teacherCheck.failed.join("; "));
  if (studentCheck.failed.length) console.warn("  Estudiantes fallidos:", studentCheck.failed.join("; "));

  const verified = {
    ...data,
    verifiedAt: new Date().toISOString(),
    verification: { director: director.ok, teachers: teacherCheck, students: studentCheck },
  };
  fs.writeFileSync(jsonPath, JSON.stringify(verified, null, 2), "utf8");

  if (!director.ok || teacherCheck.ok === 0 || studentCheck.ok === 0) {
    console.error("Verificación incompleta — revise contraseña o ejecute RUN_REPAIR=1 en Railway.");
    process.exit(1);
  }

  console.log("Verificación OK — CSV listos para login en la web.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
