/**
 * FASE 5 — Spec 04: recursos (Materiales, Actividades, Avisos, Cursos) por
 * rol. (IDs F5.16–F5.18)
 */
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

test("F5.16 director: Materiales y Actividades cargan sus vistas", async () => {
  const page = await shared("director");
  await gotoSection(page, "Materiales");
  await expectVisible(text(page, "Materiales educativos"));
  await assertNoCrash(page);

  await gotoSection(page, "Actividades");
  await expectVisible(text(page, "Actividades académicas"));
  await assertNoCrash(page);
});

test("F5.17 profesor: Actividades y Avisos cargan sus vistas", async () => {
  const page = await shared("profesorA");
  await gotoSection(page, "Actividades");
  await expectVisible(text(page, "Actividades académicas"));
  await assertNoCrash(page);

  await gotoSection(page, "Avisos");
  await expectVisible(
    page.getByRole("heading", { name: "Avisos", exact: true }).filter({ visible: true }).first(),
  );
  await expectVisible(text(page, "Publicaciones de solo lectura"));
  await assertNoCrash(page);
});

test("F5.18 estudiante: sus cursos y materiales", async () => {
  const page = await shared("estudianteA");
  await gotoSection(page, "Cursos");
  await expectVisible(text(page, "Mis cursos"));
  await assertNoCrash(page);

  await gotoSection(page, "Materiales");
  await expectVisible(text(page, "Materiales educativos"));
  await assertNoCrash(page);
});
