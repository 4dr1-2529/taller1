/**
 * FASE 5 — Spec 01: inicio de sesión por matriz de roles, validación de
 * formulario y estado de carga. (IDs F5.1–F5.5)
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Browser } from "playwright";
import { ACCOUNTS, TIMEOUT, type RoleKey } from "../support/config.js";
import {
  assertNoCrash,
  expectToast,
  gotoLogin,
  launchBrowser,
  navButton,
  openFresh,
  openRaw,
} from "../support/helpers.js";

let browser: Browser;
before(async () => {
  browser = await launchBrowser();
});
after(async () => {
  await browser.close();
});

const ANCHOR: Record<RoleKey, string> = {
  director: "Auditoría",
  profesorA: "Mis estudiantes",
  profesorB: "Mis estudiantes",
  estudianteA: "Mis notas",
  estudianteB: "Mis notas",
};

test("F5.1 los cinco roles inician sesión y llegan al panel", async () => {
  for (const role of Object.keys(ANCHOR) as RoleKey[]) {
    // openFresh fuerza un login real (y deja la sesión cacheada para el resto
    // de la corrida, vía storageState en el directorio temporal).
    const page = await openFresh(browser, role);
    assert.equal(new URL(page.url()).pathname, "/", `${role} no quedo en el panel`);
    await navButton(page, ANCHOR[role]).first().waitFor({ timeout: TIMEOUT });
    await assertNoCrash(page);
  }
});

test("F5.2 contraseña incorrecta: toast de error y permanece en /login", async () => {
  const page = await openRaw(browser);
  await gotoLogin(page);
  await page.fill("#login-email", ACCOUNTS.director.email);
  await page.fill("#login-password", "WrongPass123");
  await page.click("button.login-submit");
  await expectToast(page, "error");
  assert.equal(new URL(page.url()).pathname, "/login");
});

test("F5.3 campos obligatorios vacíos: el navegador bloquea el envío", async () => {
  const page = await openRaw(browser);
  await gotoLogin(page);
  await page.click("button.login-submit");
  assert.equal(
    await page.locator("#login-email:invalid").count(),
    1,
    "el correo vacío debe quedar inválido (:invalid) y no enviarse",
  );
  assert.equal(new URL(page.url()).pathname, "/login");
});

test("F5.4 contraseña corta: el navegador bloquea el envío (minLength 6)", async () => {
  const page = await openRaw(browser);
  await gotoLogin(page);
  await page.fill("#login-email", ACCOUNTS.director.email);
  await page.fill("#login-password", "abc");
  await page.click("button.login-submit");
  assert.equal(
    await page.locator("#login-password:invalid").count(),
    1,
    "la contraseña corta debe quedar inválida (:invalid) y no enviarse",
  );
  assert.equal(new URL(page.url()).pathname, "/login");
});

test("F5.5 estado de carga: botón deshabilitado mientras la petición está en vuelo", async () => {
  const page = await openRaw(browser);
  await page.route("**/api/v1/auth/login", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await gotoLogin(page);
  await page.fill("#login-email", ACCOUNTS.director.email);
  await page.fill("#login-password", ACCOUNTS.director.password);
  await page.click("button.login-submit");
  await page.waitForSelector("button.login-submit[disabled]", { timeout: 3000 });
  // Igual que login(): esperar por pathname, no por evento "load".
  await page.waitForFunction(() => document.location.pathname === "/", null, {
    timeout: TIMEOUT,
  });
  assert.equal(new URL(page.url()).pathname, "/", "tras login con carga lenta debe llegar al panel");
});
