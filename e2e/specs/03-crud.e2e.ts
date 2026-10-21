/**
 * FASE 5 — Spec 03: acciones CRUD permitidas al director (buscar, crear
 * docente, crear estudiante, filtrar matrículas). (IDs F5.12–F5.15)
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Browser, Page } from "playwright";
import { TIMEOUT, type RoleKey } from "../support/config.js";
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

function parseCount(label: string, value: string): number {
  const match = value.match(/\((\d+)\)/);
  assert.ok(match, `No se pudo leer el contador de "${label}" en: ${value}`);
  return Number(match[1]);
}

async function waitTeacherCount(page: Page, expected: number): Promise<void> {
  await page.waitForFunction(
    (n) => {
      const heading = Array.from(document.querySelectorAll("h3")).find((el) =>
        (el.textContent ?? "").includes("Plantilla docente"),
      );
      return !!heading && (heading.textContent ?? "").includes(`(${n})`);
    },
    expected,
    { timeout: TIMEOUT },
  );
}

test("F5.12 profesores: el buscador filtra por código", async () => {
  const page = await shared("director");
  await gotoSection(page, "Profesores");
  await expectVisible(text(page, "Gestión de profesores"));
  const heading = page.getByRole("heading", { name: /^Plantilla docente/ });
  await expectVisible(heading);
  const before = parseCount("Plantilla docente", await heading.innerText());

  const search = page.getByPlaceholder("Buscar por nombre, código, especialidad o correo…");
  await search.fill("PROF-901");
  await waitTeacherCount(page, 1);

  await search.fill("");
  await waitTeacherCount(page, before);
  await assertNoCrash(page);
});

test("F5.13 profesores: el director crea un docente desde el formulario", async () => {
  const page = await shared("director");
  await gotoSection(page, "Profesores");
  const heading = page.getByRole("heading", { name: /^Plantilla docente/ });
  await expectVisible(heading);
  const before = parseCount("Plantilla docente", await heading.innerText());

  const form = page.locator("form").filter({
    has: page.getByPlaceholder("profesor@iep-huancayo.edu.pe"),
  });
  await expectVisible(form);
  await form.getByLabel("DNI").fill("70000088");
  // PersonNameInput sanea con sanitizePersonName en cada tecla: el nombre debe
  // ser solo letras (con "E2E" la tarjeta terminaba mostrando "EE Creado").
  await form.getByLabel("Nombres").fill("Edison");
  await form.getByLabel("Apellidos").fill("Creado");
  await form.getByLabel("Especialidad").fill("Pruebas E2E");
  await form.getByPlaceholder("profesor@iep-huancayo.edu.pe").fill("e2e-teacher@example.test");

  // Sin cuenta de acceso: no debe pedir contraseña inicial.
  const createAccount = form.getByRole("checkbox").first();
  if (await createAccount.isChecked()) await createAccount.uncheck();

  await form.getByRole("button", { name: /Guardar docente|Guardando/ }).click();
  await waitTeacherCount(page, before + 1);
  // La plantilla es una lista <ul><li>, no una tabla: la tarjeta muestra
  // "{nombres} {apellidos} ({codigo})".
  await expectVisible(text(page, "Edison Creado"));
  await assertNoCrash(page);
});

test("F5.14 estudiantes: el director crea un estudiante en sección F4", async () => {
  const page = await shared("director");
  await gotoSection(page, "Estudiantes");
  await expectVisible(text(page, "Registrar estudiante 2026"));

  const form = page.locator("form").filter({ has: page.getByPlaceholder("12345678") });
  await expectVisible(form);
  await form.getByLabel("DNI").fill("90000777");
  // Nombres/apellidos solo letras (la validación de persona rechaza dígitos).
  await form.getByLabel("Nombres").fill("Edison");
  await form.getByLabel("Apellidos").fill("Prueba");

  const seccion = form.getByLabel("Sección");
  const options = await seccion.locator("option").allTextContents();
  const f4Index = options.findIndex((label) => label.includes("F4"));
  assert.ok(
    f4Index > 0,
    `No se encontro una seccion F4 en el selector. Opciones: ${options.join(" | ")}`,
  );
  await seccion.selectOption({ index: f4Index });

  // H-3 (Sprint 4): capturar el contador previo para verificar que el alta
  // lo incrementa sin depender de una búsqueda ni cambio de página.
  const heading = page.getByRole("heading", { name: /^Estudiantes \(\d+\)$/ });
  const prevCount = /\((\d+)\)/.exec(await heading.textContent() ?? "")?.[1];
  assert.ok(prevCount !== undefined, "No se pudo leer el contador previo de estudiantes");

  await form.getByRole("button", { name: /Agregar estudiante|Registrando/ }).click();
  // El toast DEBE ser el del alta (emite después del POST exitoso); filtrar por
  // texto evita confundirlo con el toast residual de éxito de F5.13 (sonner),
  // lo que dejaría la búsqueda corriendo antes de que exista el registro.
  await page
    .locator("[data-sonner-toast]", { hasText: "Estudiante registrado" })
    .first()
    .waitFor({ timeout: TIMEOUT });

  // H-3: el contador del encabezado se resincroniza con el backend tras el
  // alta (antes quedaba obsoleto hasta buscar o cambiar de página).
  await expectVisible(
    page.getByRole("heading", { name: `Estudiantes (${Number(prevCount) + 1})` }),
  );

  const search = page.getByPlaceholder("Buscar por nombre o código…");
  await search.fill("Edison");
  await expectVisible(page.locator("tbody tr").filter({ hasText: "Edison Prueba" }).first());
  // total bajo búsqueda = total del filtro servidor (1 coincidencia).
  await expectVisible(page.getByRole("heading", { name: "Estudiantes (1)" }));
  await assertNoCrash(page);
});

test("F5.15 matrículas: filtro sin resultados muestra estado vacío", async () => {
  const page = await shared("director");
  await gotoSection(page, "Matrícula 2026");
  await expectVisible(text(page, "Matrículas institucionales"));
  const search = page.getByPlaceholder("Buscar por código, nombre o apellido…");
  await search.fill("ZZZ-NOEXISTE");
  await expectVisible(text(page, "Sin matrículas para el filtro seleccionado."));
  await assertNoCrash(page);
});
