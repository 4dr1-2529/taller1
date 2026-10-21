/**
 * FASE 5 — Spec 06: predicciones, alertas y reportes por rol. (IDs F5.22–F5.26)
 *
 * Nota: la vista de predicción maneja por diseño la ausencia del servicio ML
 * (estados "Aún no se ha generado una estimación" / error 503); aquí se
 * verifica carga de vista, no la inferencia (cubierta por FASE 6 con las 32
 * pruebas unitarias del servicio y la verificación del contrato).
 */
import { after, before, test } from "node:test";
import type { Browser, Page } from "playwright";
import { type RoleKey } from "../support/config.js";
import {
  assertNoCrash,
  expectAnyText,
  expectVisible,
  gotoSection,
  launchBrowser,
  openRole,
  text,
} from "../support/helpers.js";

let browser: Browser;
const sharedPages = new Map<RoleKey, Page>();

async function shared(role: RoleKey): Promise<Page> {
  let page = sharedPages.get(role);
  if (!page) {
    page = await openRole(browser, role);
    sharedPages.set(role, page);
  }
  return page;
}

before(async () => {
  browser = await launchBrowser();
});
after(async () => {
  await browser.close();
});

test("F5.22 director: evaluación individual de riesgo", async () => {
  const page = await shared("director");
  await gotoSection(page, "Predicción de riesgo");
  await expectVisible(text(page, "Evaluación individual de riesgo"));
  await expectVisible(text(page, "Generar estimación"));
  await assertNoCrash(page);
});

test("F5.23 director: historial de predicciones", async () => {
  const page = await shared("director");
  await gotoSection(page, "Historial de predicciones");
  await expectVisible(text(page, "Registros del modelo"));
  await assertNoCrash(page);
});

test("F5.24 director: alertas tempranas", async () => {
  const page = await shared("director");
  await gotoSection(page, "Alertas tempranas");
  await expectAnyText(page, [
    "Alertas que requieren acción",
    "Listado de alertas",
    "No hay estudiantes en alerta.",
  ]);
  await assertNoCrash(page);
});

test("F5.25 profesor: alertas tempranas y reportes", async () => {
  const page = await shared("profesorA");
  await gotoSection(page, "Alertas tempranas");
  await expectVisible(text(page, "Listado de alertas"));
  await assertNoCrash(page);

  await gotoSection(page, "Mis reportes");
  await expectVisible(text(page, "Reportes académicos"));
  await assertNoCrash(page);
});

test("F5.26 estudiante: mi riesgo, mis notas y mi asistencia", async () => {
  const page = await shared("estudianteA");
  await gotoSection(page, "Mi riesgo");
  await expectVisible(text(page, "Mi riesgo de deserción"));
  await assertNoCrash(page);

  await gotoSection(page, "Mis notas");
  await expectAnyText(page, ["Mis calificaciones por curso", "Notas por curso"]);
  await assertNoCrash(page);

  await gotoSection(page, "Mi asistencia");
  await expectAnyText(page, ["Mi historial de asistencia", "Historial de asistencia"]);
  await assertNoCrash(page);
});
