/**
 * FASE 5 — Spec 07: estados de error, vacío y validación de formularios con
 * errores de API simulados. (IDs F5.27–F5.30)
 *
 * Las respuestas 500/403 se inyectan con page.route sobre el frontend local:
 * nunca se toca ningún servicio externo.
 */
import { after, before, test } from "node:test";
import type { Browser, Page } from "playwright";
import { type RoleKey } from "../support/config.js";
import {
  assertNoCrash,
  expectErrorSurfaced,
  expectToast,
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

async function injectAlertsError(page: Page, status: number): Promise<void> {
  await page.route("**/api/v1/alerts**", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: `Error simulado ${status} (prueba E2E local)`,
        errors: ["E2E_SIMULADO"],
      }),
    }),
  );
}

test("F5.27 estado vacío: filtro de estudiantes sin resultados", async () => {
  const page = await shared("director");
  await gotoSection(page, "Estudiantes");
  await expectVisible(text(page, "Registrar estudiante 2026"));
  const search = page.getByPlaceholder("Buscar por nombre o código…");
  await search.fill("ZZZ-NOEXISTE");
  await expectVisible(text(page, "No existen registros para los filtros seleccionados."));
  await assertNoCrash(page);
});

test("F5.28 error de API 500 simulado: se muestra estado de reintento", async () => {
  // Reusa la página compartida: abrir un contexto nuevo agota el rate-limit
  // global del backend (300 req/15 min) al final de la corrida.
  const page = await shared("director");
  await injectAlertsError(page, 500);
  await gotoSection(page, "Alertas tempranas");
  await expectErrorSurfaced(page);
  await page.unroute("**/api/v1/alerts**");
  await assertNoCrash(page);
});

test("F5.29 respuesta 403 simulada: la denegación se hace visible en UI", async () => {
  const page = await shared("director");
  await injectAlertsError(page, 403);
  // La vista de alertas quedó montada desde F5.28: cambiar de sección y volver
  // fuerza el desmontaje/remontaje (el fetch de montaje es el interceptado).
  await gotoSection(page, "Historial de predicciones");
  await gotoSection(page, "Alertas tempranas");
  await expectErrorSurfaced(page);
  await page.unroute("**/api/v1/alerts**");
  await assertNoCrash(page);
});

test("F5.30 validación de formulario: alta de estudiante vacío no se envía", async () => {
  const page = await shared("director");
  // F5.29 dejó la página en Alertas: volver a Estudiantes remonta el formulario.
  await gotoSection(page, "Estudiantes");
  const form = page.locator("form").filter({ has: page.getByPlaceholder("12345678") });
  await expectVisible(form);
  await form.getByRole("button", { name: /Agregar estudiante|Registrando/ }).click();
  const invalid = await form.locator(":invalid").count();
  if (invalid === 0) {
    // Sin bloqueo nativo, la validación de cliente debe avisar por toast.
    await expectToast(page, "error");
  }
  await assertNoCrash(page);
});
