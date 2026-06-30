/**
 * Capturas UI reales con Playwright (Microsoft Edge).
 * Requiere: npm run dev (web+api+ml) y datos demo.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = process.env.WEB_URL ?? "http://localhost:3029";
const EVIDENCE = join(ROOT, "plan-pruebas/evidencias-finales");

const EMAIL = process.env.QA_EMAIL ?? "director@blenkir.edu.pe";
const PASSWORD = process.env.QA_PASSWORD ?? "mbappe29";

/** Carpeta → etiqueta visible en sidebar (admin) */
const CAPTURES = [
  { folder: "login", beforeLogin: true },
  { folder: "dashboard", label: "Dashboard" },
  { folder: "profesores", label: "Profesores" },
  { folder: "cursos", label: "Cursos" },
  { folder: "estudiantes", label: "Estudiantes" },
  { folder: "usuarios", label: "Estudiantes", filename: "usuarios-estudiantes.png" },
  { folder: "notas", label: "Notas" },
  { folder: "prediccion", label: "Predicción de riesgo" },
  { folder: "alertas", label: "Alertas tempranas" },
  { folder: "reportes", label: "Reportes" },
  { folder: "configuracion", label: "Asignaciones docentes", filename: "configuracion-asignaciones.png" },
];

function outPath(folder, filename) {
  const dir = join(EVIDENCE, folder);
  mkdirSync(dir, { recursive: true });
  return join(dir, filename ?? `${folder}.png`);
}

async function waitForAppReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const skeleton = page.locator('[class*="Skeleton"], [aria-label="Cargando"]');
  if (await skeleton.count()) {
    await skeleton.first().waitFor({ state: "hidden", timeout: 45000 }).catch(() => {});
  }
  await page.waitForTimeout(800);
}

async function clickSection(page, label) {
  const btn = page.getByRole("button", { name: label, exact: false }).first();
  await btn.waitFor({ state: "visible", timeout: 20000 });
  await btn.click();
  await waitForAppReady(page);
}

async function main() {
  const log = [];
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "es-PE",
  });
  const page = await context.newPage();

  try {
    // Login screen
    const loginEntry = CAPTURES.find((c) => c.beforeLogin);
    if (loginEntry) {
      await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForSelector("#login-email", { timeout: 30000 });
      await waitForAppReady(page);
      const loginFile = outPath(loginEntry.folder, "login.png");
      await page.screenshot({ path: loginFile, fullPage: true });
      log.push({ module: loginEntry.folder, file: loginFile, status: "OK" });
      console.log("✓ captura:", loginFile);
    }

    await page.fill("#login-email", EMAIL);
    await page.fill("#login-password", PASSWORD);
    await page.getByRole("button", { name: /Ingresar al panel/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 45000 });
    await waitForAppReady(page);

    for (const cap of CAPTURES) {
      if (cap.beforeLogin) continue;
      try {
        await clickSection(page, cap.label);
        const file = outPath(cap.folder, cap.filename);
        await page.screenshot({ path: file, fullPage: true });
        log.push({ module: cap.folder, section: cap.label, file, status: "OK" });
        console.log("✓ captura:", file);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.push({ module: cap.folder, section: cap.label, status: "FAIL", error: msg });
        console.error("✗", cap.folder, msg);
        throw e;
      }
    }
  } finally {
    await browser.close();
  }

  const manifest = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    user: EMAIL,
    captures: log,
  };
  const manifestPath = join(EVIDENCE, "resultados", "capturas-manifest.json");
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log("Manifest:", manifestPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
