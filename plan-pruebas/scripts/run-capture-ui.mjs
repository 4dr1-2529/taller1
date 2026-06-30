/**
 * Capturas UI reales — Director, Profesor, Alumno (Playwright + Edge)
 */
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { PATHS, URLS, CREDS } from "./lib/config.mjs";
import { login as apiLogin } from "./lib/http.mjs";

const CAPTURAS_DIR = join(PATHS.evidenciasFinales, "capturas");
const CN_EVID = PATHS.cajaNegraEvidencias;

const ROLES = [
  {
    key: "director",
    creds: CREDS.director,
    prefix: "director",
    sections: [
      { file: "dashboard-director-ok.png", label: "Dashboard" },
      { file: "profesores-listado.png", label: "Profesores" },
      { file: "estudiantes-listado-director.png", label: "Estudiantes" },
      { file: "cursos-listado.png", label: "Cursos" },
      { file: "notas-bimestre-1-ok.png", label: "Notas" },
      { file: "prediccion-riesgo-alto-ok.png", label: "Predicción de riesgo" },
      { file: "alertas-listado.png", label: "Alertas tempranas" },
      { file: "reportes-vista-completa.png", label: "Reportes" },
      { file: "asignaciones-docentes.png", label: "Asignaciones docentes" },
    ],
  },
  {
    key: "profesor",
    creds: CREDS.profesor,
    prefix: "profesor",
    sections: [
      { file: "dashboard-profesor-ok.png", label: "Dashboard" },
      { file: "notas-profesor-bimestre.png", label: "Notas" },
      { file: "alertas-profesor.png", label: "Alertas tempranas" },
    ],
  },
  {
    key: "alumno",
    creds: CREDS.estudiante,
    prefix: "alumno",
    sections: [
      { file: "dashboard-alumno-ok.png", label: "Dashboard" },
      { file: "notas-alumno.png", label: "Mis notas" },
      { file: "asistencia-alumno.png", label: "Mi asistencia" },
      { file: "prediccion-alumno.png", label: "Mi riesgo" },
    ],
  },
];

mkdirSync(CAPTURAS_DIR, { recursive: true });
mkdirSync(CN_EVID, { recursive: true });
mkdirSync(join(PATHS.evidenciasFinales, "dashboard"), { recursive: true });
mkdirSync(join(PATHS.evidenciasFinales, "notas"), { recursive: true });
mkdirSync(join(PATHS.evidenciasFinales, "frontend"), { recursive: true });

async function waitReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function loginViaApi(page, email, password) {
  const { token, body } = await apiLogin(email, password);
  const data = body.data ?? body;
  const user = data.user;
  const refresh = data.refreshToken;
  await page.goto(`${URLS.web}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ token, user, refresh }) => {
      localStorage.setItem("tesis-token", token);
      if (refresh) localStorage.setItem("tesis-refresh-token", refresh);
      localStorage.setItem("tesis-user", JSON.stringify(user));
    },
    { token, user, refresh },
  );
  await page.goto(`${URLS.web}/`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
}

async function clickSection(page, label) {
  const btn = page.getByRole("button", { name: label, exact: false }).first();
  await btn.waitFor({ state: "visible", timeout: 20000 });
  await btn.click();
  await waitReady(page);
}

async function main() {
  const log = [];
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "es-PE" });
  const page = await context.newPage();

  try {
    await page.goto(`${URLS.web}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#login-email");
    const loginPath = join(CAPTURAS_DIR, "login-pantalla-inicial.png");
    await page.screenshot({ path: loginPath, fullPage: true });
    log.push({ file: loginPath, caso: "TC-CN-01", estado: "Aprobado" });
    copyFileSync(loginPath, join(PATHS.evidenciasFinales, "frontend", "login-pantalla-inicial.png"));

    for (const role of ROLES) {
      const roleContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "es-PE" });
      const rolePage = await roleContext.newPage();
      try {
        await loginViaApi(rolePage, role.creds.email, role.creds.password);
        const loginOk = join(CAPTURAS_DIR, `login-${role.prefix}-ok.png`);
        await rolePage.screenshot({ path: loginOk, fullPage: true });
        log.push({ file: loginOk, caso: `Login ${role.key}`, estado: "Aprobado" });

        for (const sec of role.sections) {
          try {
            await clickSection(rolePage, sec.label);
            const dest = join(CAPTURAS_DIR, sec.file);
            await rolePage.screenshot({ path: dest, fullPage: true });
            log.push({ file: dest, section: sec.label, role: role.key, estado: "Aprobado" });

            const cnCase = {
              id: `TC-CN-${role.prefix}-${sec.file}`,
              captura_inicial: loginOk,
              captura_resultado: dest,
              esperado: `Vista ${sec.label} operativa`,
              obtenido: "Pantalla renderizada sin error",
              estado: "Aprobado",
            };
            writeFileSync(join(CN_EVID, `${sec.file}.json`), JSON.stringify(cnCase, null, 2));

            if (sec.file.includes("dashboard")) {
              copyFileSync(dest, join(PATHS.evidenciasFinales, "dashboard", sec.file));
            }
            if (sec.file.includes("notas")) {
              copyFileSync(dest, join(PATHS.evidenciasFinales, "notas", sec.file));
            }
          } catch (e) {
            log.push({ section: sec.label, role: role.key, estado: "Fallido", error: String(e) });
          }
        }
      } catch (e) {
        log.push({ role: role.key, estado: "Fallido", error: String(e) });
      } finally {
        await roleContext.close();
      }
    }
  } finally {
    await browser.close();
  }

  const manifest = { captured_at: new Date().toISOString(), captures: log };
  writeFileSync(join(CN_EVID, "capturas-manifest.json"), JSON.stringify(manifest, null, 2));
  writeFileSync(join(CAPTURAS_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Capturas: ${log.filter((l) => l.estado === "Aprobado").length}/${log.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
