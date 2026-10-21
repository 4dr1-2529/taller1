/**
 * FASE 5 — Spec 02: módulos visibles por rol, navegación básica y cierre de
 * sesión. (IDs F5.6–F5.11)
 *
 * Las pruebas comparten una página por rol dentro del archivo (orden serial
 * garantizado por node:test) para no multiplicar arranques de SPA ni llamadas
 * contra el rate-limit global del backend (300 req/15 min).
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Browser, Page } from "playwright";
import { BASE_URL, type RoleKey } from "../support/config.js";
import {
  assertNoCrash,
  expectVisible,
  gotoSection,
  launchBrowser,
  navAbsent,
  navButton,
  openFresh,
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

async function assertSections(
  page: Page,
  visible: string[],
  absent: string[],
  who: string,
): Promise<void> {
  for (const label of visible) {
    assert.ok(
      (await navButton(page, label).count()) > 0,
      `${who} debe ver la seccion "${label}"`,
    );
  }
  for (const label of absent) {
    assert.equal(
      await navAbsent(page, label).count(),
      0,
      `${who} NO debe ver la seccion "${label}"`,
    );
  }
}

test("F5.6 director: ve secciones institucionales y no las de otros roles", async () => {
  const page = await shared("director");
  await assertSections(
    page,
    ["Auditoría", "Matrícula 2026", "Asignaciones docentes", "Profesores", "Reportes", "Grados y secciones", "Configuración"],
    ["Mis estudiantes", "Mis reportes"],
    "director",
  );
  await assertNoCrash(page);
});

test("F5.7 profesor: ve sus módulos y no los institucionales", async () => {
  const page = await shared("profesorA");
  await assertSections(
    page,
    ["Mis estudiantes", "Mis cursos", "Mis reportes", "Notas", "Asistencia", "Alertas tempranas", "Configuración"],
    ["Auditoría", "Matrícula 2026", "Asignaciones docentes", "Profesores", "Grados y secciones", "Reportes"],
    "profesor A",
  );
  await assertNoCrash(page);
});

test("F5.8 estudiante: ve solo su portal", async () => {
  const page = await shared("estudianteA");
  await assertSections(
    page,
    ["Mis notas", "Mi asistencia", "Mi riesgo", "Mis alertas", "Configuración"],
    ["Auditoría", "Profesores", "Matrícula 2026", "Asignaciones docentes", "Reportes", "Estudiantes"],
    "estudiante A",
  );
  await assertNoCrash(page);
});

test("F5.9 director: cambiar de sección marca aria-current y carga la vista", async () => {
  const page = await shared("director");
  await gotoSection(page, "Auditoría");
  await expectVisible(text(page, "Auditoría del sistema"));
  await gotoSection(page, "Estudiantes");
  await expectVisible(text(page, "Registrar estudiante 2026"));
  await assertNoCrash(page);
});

test("F5.10 profesor: cambiar de sección carga su vista de notas", async () => {
  const page = await shared("profesorA");
  await gotoSection(page, "Notas");
  await expectVisible(text(page, "Registro de notas"));
  await assertNoCrash(page);
});

test("F5.11 cierre de sesión: vuelve a /login y el panel exige sesión", async () => {
  // Login real dedicado: esta prueba revoca la sesión, por eso no reutiliza
  // ni reescribe la sesión cacheada del director.
  const page = await openFresh(browser, "director", { persist: false });
  const logout = page
    .getByRole("button", { name: "Cerrar sesión" })
    .filter({ visible: true })
    .first();
  await expectVisible(logout);
  await logout.click();
  await page.waitForURL((url) => url.pathname === "/login", { timeout: 20000 });

  // Con la sesión cerrada, "/" debe redirigir a /login.
  await page.goto(`${BASE_URL}/`);
  await page.waitForURL((url) => url.pathname === "/login", { timeout: 20000 });
});
