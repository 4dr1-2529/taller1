/**
 * Captura evidencias UI reales vía Playwright (local :3029).
 * Uso: node capture-ui.mjs
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import {
  BASE_URL,
  PASSWORD,
  USERS,
  OUT_CAP,
  OUT_LEGACY,
} from "./config.mjs";
import { selectFirstSeccion, runServerPrediction } from "./evidence-helpers.mjs";

const VIEWPORT = { width: 1920, height: 1080 };

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function shot(page, relPath, fullPage = true) {
  const dest = path.join(OUT_CAP, relPath);
  ensureDir(path.dirname(dest));
  await page.screenshot({ path: dest, fullPage, animations: "disabled" });
  console.log("  ✓", relPath);

  const legacyMap = {
    "01-login/": "capturas/",
    "02-dashboard/": "dashboard/",
    "03-profesores/": "capturas/",
    "04-cursos/": "capturas/",
    "05-estudiantes/": "capturas/",
    "06-notas/": "capturas/",
    "07-prediccion/": "ia/",
    "08-dashboard-ia/": "dashboard/",
    "09-reportes/": "capturas/",
    "14-qa/": "frontend/",
  };
  for (const [prefix, leg] of Object.entries(legacyMap)) {
    if (relPath.startsWith(prefix)) {
      const legDest = path.join(OUT_LEGACY, leg, path.basename(relPath));
      ensureDir(path.dirname(legDest));
      fs.copyFileSync(dest, legDest);
      break;
    }
  }
}

async function waitAppReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 120_000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

async function fillLogin(page, email) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitAppReady(page);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(PASSWORD);
}

async function submitLogin(page) {
  await page.getByRole("button", { name: /Ingresar al panel/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 60_000 });
  await waitAppReady(page);
}

async function logout(page) {
  await page.getByRole("button", { name: /Salir/i }).click();
  await page.waitForURL(/login/, { timeout: 30_000 });
  await waitAppReady(page);
}

async function goSection(page, labelPattern) {
  const btn = page.getByRole("button", { name: labelPattern }).first();
  await btn.click();
  await waitAppReady(page);
}

async function captureLoginScreens(page) {
  console.log("\n[1] Login");
  ensureDir(path.join(OUT_CAP, "01-login"));

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitAppReady(page);
  await shot(page, "01-login/login-pantalla-inicial.png");

  for (const [key, u] of Object.entries(USERS)) {
    await fillLogin(page, u.email);
    await shot(page, `01-login/login-${key}-credenciales.png`);
    await submitLogin(page);
    await shot(page, `01-login/login-${key}-sesion-activa.png`);
    await logout(page);
  }

  await fillLogin(page, "invalido@blenkir.edu.pe");
  await page.locator("#login-password").fill("wrongpass");
  await page.getByRole("button", { name: /Ingresar al panel/i }).click();
  await page.waitForTimeout(2000);
  await shot(page, "14-qa/login-error-controlado.png", false);
}

async function captureDirector(page) {
  console.log("\n[2-9] Director — dashboards y módulos");
  await fillLogin(page, USERS.director.email);
  await submitLogin(page);

  await shot(page, "02-dashboard/dashboard-director.png");

  await goSection(page, /Estudiantes/i);
  await shot(page, "05-estudiantes/estudiantes-listado-director.png");

  await goSection(page, /Profesores/i);
  await shot(page, "03-profesores/profesores-listado.png");

  await goSection(page, /Asignaciones docentes/i);
  await shot(page, "03-profesores/asignaciones-docentes.png");

  await goSection(page, /Cursos/i);
  await shot(page, "04-cursos/cursos-listado.png");

  await goSection(page, /Notas/i);
  await page.waitForTimeout(2000);
  await shot(page, "06-notas/notas-vista-inicial.png");

  const gradoSelect = page.locator("select").first();
  if (await gradoSelect.count()) {
    const opts = await gradoSelect.locator("option").allTextContents();
    if (opts.length > 1) {
      await gradoSelect.selectOption({ index: 1 });
      await page.waitForTimeout(800);
      const sec = page.locator("select").nth(1);
      if (await sec.count()) {
        await sec.selectOption({ index: 1 });
        await page.waitForTimeout(800);
        const cur = page.locator("select").nth(2);
        if (await cur.count()) {
          await cur.selectOption({ index: 1 });
          await page.waitForTimeout(800);
        }
        const bim = page.locator("select").filter({ hasText: /bimestre|Bimestre/i }).first();
        if (await bim.count()) {
          await bim.selectOption({ label: /1|I|Primero/i }).catch(async () => {
            await bim.selectOption({ index: 1 });
          });
          await page.waitForTimeout(2500);
          await shot(page, "06-notas/notas-bimestre-I.png");
          await bim.selectOption({ index: 2 }).catch(() => {});
          await page.waitForTimeout(2500);
          await shot(page, "06-notas/notas-bimestre-II.png");
        }
      }
    }
  }

  await goSection(page, /Predicción de riesgo/i);
  await page.waitForTimeout(2000);
  await selectFirstSeccion(page);
  await shot(page, "07-prediccion/prediccion-vista-director.png");
  try {
    await runServerPrediction(page);
    await shot(page, "07-prediccion/prediccion-resultado-riesgo.png");
  } catch (e) {
    console.warn("  ! prediccion-resultado:", e.message);
  }

  await goSection(page, /Alertas tempranas/i);
  await page.waitForTimeout(2000);
  await shot(page, "08-dashboard-ia/alertas-listado.png");

  await goSection(page, /Historial de predicciones/i);
  await page.waitForTimeout(2000);
  await shot(page, "08-dashboard-ia/historial-predicciones.png");

  await goSection(page, /Reportes/i);
  await page.waitForTimeout(2000);
  await shot(page, "09-reportes/reportes-vista.png");

  await goSection(page, /Dashboard/i);
  await logout(page);
}

async function captureProfesor(page) {
  console.log("\n[2] Profesor — dashboard");
  await fillLogin(page, USERS.profesor.email);
  await submitLogin(page);
  await shot(page, "02-dashboard/dashboard-profesor.png");

  await goSection(page, /Estudiantes/i);
  await shot(page, "03-profesores/profesor-estudiantes-ambito.png");

  await goSection(page, /Notas/i);
  await page.waitForTimeout(2000);
  await shot(page, "06-notas/notas-vista-profesor.png");

  await goSection(page, /Predicción de riesgo/i);
  await page.waitForTimeout(2000);
  await shot(page, "07-prediccion/prediccion-vista-profesor.png");

  await logout(page);
}

async function captureEstudiante(page) {
  console.log("\n[2] Alumno — dashboard");
  await fillLogin(page, USERS.estudiante.email);
  await submitLogin(page);
  await shot(page, "02-dashboard/dashboard-alumno.png");

  await goSection(page, /Mis notas/i);
  await shot(page, "05-estudiantes/alumno-mis-notas.png");

  await goSection(page, /Mi riesgo/i);
  await page.waitForTimeout(2000);
  await shot(page, "07-prediccion/alumno-mi-riesgo.png");

  await logout(page);
}

async function main() {
  ensureDir(OUT_CAP);
  console.log("Captura UI →", OUT_CAP);
  console.log("Base URL:", BASE_URL);

  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: "es-PE",
  });
  const page = await context.newPage();

  try {
    await captureLoginScreens(page);
    await captureDirector(page);
    await captureProfesor(page);
    await captureEstudiante(page);
    console.log("\nCapturas UI completadas.");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error("ERROR capture-ui:", e);
  process.exit(1);
});
