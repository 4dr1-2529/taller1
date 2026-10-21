/**
 * FASE 5 — Spec 05: módulos de Notas y Asistencia por rol. (IDs F5.19–F5.21)
 *
 * Cobertura de vista + filtros iniciales. El flujo completo de registro de
 * nota/asistencia con selectores en cascada (grado -> sección -> curso ->
 * bimestre) queda documentado como pendiente de calibración en e2e/README.md;
 * su respaldo HTTP existe en FASE 3/4 (integración y roles).
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Browser, Page } from "playwright";
import { type RoleKey } from "../support/config.js";
import {
  assertNoCrash,
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

test("F5.19 profesor: notas inicia con filtros y sin tabla hasta buscar", async () => {
  const page = await shared("profesorA");
  await gotoSection(page, "Notas");
  await expectVisible(text(page, "Registro de notas"));
  await expectVisible(text(page, "Grado → sección → curso → bimestre → Buscar"));
  assert.equal(
    await page.getByText("Alumnos del salón").count(),
    0,
    "la tabla del salón no debe existir antes de buscar",
  );
  await assertNoCrash(page);
});

test("F5.20 profesor: asistencia carga su vista de grupo", async () => {
  const page = await shared("profesorA");
  await gotoSection(page, "Asistencia");
  await expectVisible(text(page, "Asistencia del grupo"));
  await assertNoCrash(page);
});

test("F5.21 director: notas y asistencia institucionales", async () => {
  const page = await shared("director");
  await gotoSection(page, "Notas");
  await expectVisible(text(page, "Registro de notas"));
  await assertNoCrash(page);

  await gotoSection(page, "Asistencia");
  // "Control de asistencia" solo existe en la rama no autenticada; la vista
  // autenticada inicial muestra el hint de salón de AcademicFiltersBar.
  await expectVisible(text(page, "Se mostrará la lista completa del salón"));
  await assertNoCrash(page);
});
