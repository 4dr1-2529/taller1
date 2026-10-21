/**
 * Utilidades comunes de la suite E2E local (Sprint 3, FASE 5).
 *
 *  - Navegador: Edge del sistema (`channel: "msedge"`), mismo canal que
 *    scripts/evidence/*.mjs — sin descarga de navegadores.
 *  - Sesiones: se reutilizan entre archivos mediante un archivo de
 *    storageState en el directorio temporal del sistema, con auto-reparación
 *    (si la sesión caducó o se revocó, se vuelve a iniciar sesión).
 *    Justificación histórica: el backend aplicaba rate-limit global de
 *    300 req/15 min en /api/v1 y reutilizar sesiones evitaba agotar ese
 *    presupuesto (corregido en Sprint 4 / H-1: backstop global de 12000
 *    req/15 min + límite estricto de 100 en rutas de autenticación; la
 *    suite completa ahora cabe en una sola ejecución).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium, type Browser, type BrowserContext, type Locator, type Page } from "playwright";
import { ACCOUNTS, BASE_URL, TIMEOUT, type RoleKey } from "./config.js";

const VIEWPORT = { width: 1440, height: 900 };
const STATE_DIR = path.join(os.tmpdir(), "blenkir-e2e-state");
/** Presupuesto para arranques fríos (primera compilación de Turbopack). */
const LONG_TIMEOUT = 60000;

function statePath(role: RoleKey): string {
  return path.join(STATE_DIR, `${role}.json`);
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ channel: "msedge", headless: true });
}

async function newContext(browser: Browser, storageState?: string): Promise<BrowserContext> {
  return browser.newContext({
    viewport: VIEWPORT,
    ...(storageState ? { storageState } : {}),
  });
}

/** Contexto "pelado" sin sesión (login inválido, estados de carga, etc.). */
export async function openRaw(browser: Browser): Promise<Page> {
  const context = await newContext(browser);
  return context.newPage();
}

export async function gotoLogin(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#login-email", { timeout: TIMEOUT });
}

export async function submitLogin(page: Page, email: string, password: string): Promise<void> {
  await gotoLogin(page);
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click("button.login-submit");
}

/** Login que exige éxito (espera quedarse en "/"). */
export async function login(page: Page, role: RoleKey): Promise<void> {
  const acc = ACCOUNTS[role];
  await submitLogin(page, acc.email, acc.password);
  // waitForFunction en vez de waitForURL: la 1ª compilación de Turbopack puede
  // demorar y waitForURL exige el evento "load" (falló con frame detached).
  await page.waitForFunction(() => document.location.pathname === "/", null, {
    timeout: LONG_TIMEOUT,
  });
  await waitForShell(page);
}

/** Señal de panel arrastrado: existe el botón de navegación "Dashboard". */
export async function waitForShell(page: Page): Promise<void> {
  await page.waitForSelector("button[aria-label='Dashboard']", { timeout: LONG_TIMEOUT });
}

/**
 * Página con sesión reutilizable para el rol: lee el storageState guardado si
 * existe; si la sesión ya no sirve (cae a /login) vuelve a iniciar sesión y
 * reescribe el archivo. Así los archivos de specs comparten sesión sin
 * multiplicar llamadas de login.
 */
export async function openRole(browser: Browser, role: RoleKey): Promise<Page> {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const file = statePath(role);
  const context = await newContext(browser, fs.existsSync(file) ? file : undefined);
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  const outcome = await Promise.race([
    page
      .waitForSelector("button[aria-label='Dashboard']", { timeout: 20000 })
      .then(() => "shell" as const)
      .catch(() => null),
    page
      .waitForSelector("#login-email", { timeout: 20000 })
      .then(() => "login" as const)
      .catch(() => null),
  ]);

  if (outcome === "shell") return page;
  if (outcome === null) {
    throw new Error(`[${role}] no se detecto sesion valida ni pantalla de login en ${BASE_URL}/`);
  }

  await login(page, role);
  fs.writeFileSync(file, JSON.stringify(await context.storageState()), "utf8");
  return page;
}

/**
 * Página con login REAL desde cero (para probar el flujo de login en sí).
 * `persist: false` no escribe el storageState (usado por el test de cierre
 * de sesión, que revoca la sesión creada).
 */
export async function openFresh(
  browser: Browser,
  role: RoleKey,
  opts?: { persist?: boolean },
): Promise<Page> {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const context = await newContext(browser);
  const page = await context.newPage();
  await login(page, role);
  if (opts?.persist !== false) {
    fs.writeFileSync(statePath(role), JSON.stringify(await context.storageState()), "utf8");
  }
  return page;
}

/** Botón de menú por aria-label, solo visibles (evita duplicados menú móvil). */
export function navButton(page: Page, label: string): Locator {
  return page.getByRole("button", { name: label, exact: true }).filter({ visible: true });
}

/** Cualquier botón con ese aria-label, visible o no (para asertar ausencia). */
export function navAbsent(page: Page, label: string): Locator {
  return page.getByRole("button", { name: label, exact: true });
}

/** Cambia de sección en el panel y espera que quede aria-current="page". */
export async function gotoSection(page: Page, label: string): Promise<void> {
  const btn = navButton(page, label).first();
  await btn.waitFor({ timeout: TIMEOUT });
  await btn.click();
  await page.waitForFunction(
    (expected: string) =>
      Array.from(document.querySelectorAll("button[aria-current='page']")).some(
        (el) => el.getAttribute("aria-label") === expected,
      ),
    label,
    { timeout: TIMEOUT },
  );
}

export async function expectVisible(locator: Locator): Promise<void> {
  await locator.waitFor({ timeout: TIMEOUT, state: "visible" });
}

export async function expectToast(page: Page, type: "error" | "success"): Promise<void> {
  const typed = page.locator(`[data-sonner-toast][data-type="${type}"]`).first();
  try {
    await typed.waitFor({ timeout: 6000 });
    return;
  } catch {
    // Respaldo: si la version de sonner no expone data-type, basta un toast visible.
    await page.locator("[data-sonner-toast]").first().waitFor({ timeout: 6000 });
  }
}

/** Un error de API debe manifestarse en UI: ErrorState (Reintentar) o toast. */
export async function expectErrorSurfaced(page: Page): Promise<void> {
  try {
    await page.getByRole("button", { name: "Reintentar" }).first().waitFor({ timeout: 6000 });
    return;
  } catch {
    await expectToast(page, "error");
  }
}

export async function assertNoCrash(page: Page): Promise<void> {
  const body = (await page.textContent("body")) ?? "";
  assert.ok(
    !/Application error|Unhandled Runtime Error|Build Error/.test(body),
    "El frontend mostro una pantalla de error de Next.js",
  );
}

/** Texto visible en algún elemento (fuera del menú lateral). */
export function text(page: Page, value: string): Locator {
  return page.getByText(value, { exact: false }).filter({ visible: true }).first();
}

/** Espera a que uno de varios textos alternativos esté visible. */
export async function expectAnyText(page: Page, candidates: string[]): Promise<void> {
  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      await expectVisible(text(page, candidate));
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `Ninguno de los textos esperados fue visible: ${candidates.join(" | ")}`,
    { cause: lastError },
  );
}
