/** Capturas complementarias: predicción con resultado, reportes, métricas IA, notas completas, QA */
import { chromium } from "playwright";
import { USERS } from "./config.mjs";
import {
  goSection,
  login,
  runServerPrediction,
  selectFirstSeccion,
  shot,
} from "./evidence-helpers.mjs";

async function captureNotasCompleto(page) {
  await goSection(page, /Notas/i);
  const selects = page.locator("select");
  if (await selects.count()) {
    if ((await selects.first().locator("option").count()) > 1) {
      await selects.first().selectOption({ index: 1 });
      await page.waitForTimeout(800);
    }
    if ((await selects.nth(1).locator("option").count()) > 1) {
      await selects.nth(1).selectOption({ index: 1 });
      await page.waitForTimeout(800);
    }
    if ((await selects.nth(2).locator("option").count()) > 1) {
      await selects.nth(2).selectOption({ index: 1 });
      await page.waitForTimeout(800);
    }
    const bim = page.locator("select").filter({ hasText: /bimestre|Bimestre/i }).first();
    if (await bim.count()) {
      await bim.selectOption({ index: 1 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }
  await shot(page, "06-notas/notas-proceso-completo.png");
}

async function captureReportes(page) {
  await goSection(page, /Reportes/i);
  await shot(page, "09-reportes/reportes-vista-completa.png");

  const reports = [
    { name: /Excel — estudiantes y riesgo/i, file: "reporte-excel-estudiantes.png" },
    { name: /PDF — riesgo por curso/i, file: "reporte-pdf-riesgo-curso.png" },
    { name: /PDF — desaprobados por curso/i, file: "reporte-pdf-desaprobados.png" },
    { name: /Excel — baja actividad LMS/i, file: "reporte-excel-lms-bajo.png" },
  ];

  for (const r of reports) {
    const btn = page.getByRole("button", { name: r.name });
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(1200);
      await shot(page, `09-reportes/${r.file}`, false);
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });

  await login(page, USERS.director.email);

  await goSection(page, /Predicción de riesgo/i);
  await selectFirstSeccion(page);
  await shot(page, "07-prediccion/prediccion-vista-director-filtros.png");
  await runServerPrediction(page);
  await shot(page, "07-prediccion/prediccion-resultado-riesgo.png");
  await shot(page, "07-prediccion/prediccion-nivel-probabilidad.png", false);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  await shot(page, "08-dashboard-ia/metricas-ia-graficos.png");
  await shot(page, "08-dashboard-ia/dashboard-ia-completo.png");

  await goSection(page, /Alertas tempranas/i);
  await shot(page, "08-dashboard-ia/alertas-listado.png");

  await captureNotasCompleto(page);
  await captureReportes(page);

  await browser.close();
  console.log("Capturas complementarias listas.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
