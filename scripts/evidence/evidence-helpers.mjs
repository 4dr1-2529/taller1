import fs from "fs";
import path from "path";
import { BASE_URL, PASSWORD, OUT_CAP, OUT_LEGACY } from "./config.mjs";

export async function shot(page, relPath, fullPage = true) {
  const dest = path.join(OUT_CAP, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await page.screenshot({ path: dest, fullPage, animations: "disabled" });
  console.log("  OK", relPath);

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
      fs.mkdirSync(path.dirname(legDest), { recursive: true });
      fs.copyFileSync(dest, legDest);
      break;
    }
  }
}

export async function waitReady(page, ms = 1500) {
  await page.waitForLoadState("networkidle", { timeout: 120_000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

export async function login(page, email) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitReady(page);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(PASSWORD);
  await page.getByRole("button", { name: /Ingresar al panel/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 60_000 });
  await waitReady(page, 2500);
}

export async function goSection(page, labelPattern) {
  await page.getByRole("button", { name: labelPattern }).first().click();
  await waitReady(page, 2000);
}

/** Selecciona primer grado y sección en filtros académicos. */
export async function selectFirstSeccion(page) {
  const grado = page.locator('label:has-text("Grado") select, select').first();
  if (await grado.count()) {
    const count = await grado.locator("option").count();
    if (count > 1) {
      await grado.selectOption({ index: 1 });
      await page.waitForTimeout(900);
    }
  }
  const seccion = page.locator('label:has-text("Sección") select').first();
  if (await seccion.count()) {
    const count = await seccion.locator("option").count();
    if (count > 1) {
      await seccion.selectOption({ index: 1 });
      await page.waitForTimeout(1500);
    }
  }
}

export async function runServerPrediction(page) {
  await selectFirstSeccion(page);
  const predictBtn = page.getByRole("button", { name: /Ejecutar predicción en servidor/i });
  await predictBtn.waitFor({ state: "visible", timeout: 30_000 });
  await predictBtn.click({ timeout: 10_000 });
  await page.waitForTimeout(6000);
}
