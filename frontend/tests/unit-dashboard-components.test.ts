import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StatCard } from "../src/components/StatCard.js";
import { BentoCell } from "../src/components/dashboard/bento/BentoCell.js";
import { AnimatedNumber } from "../src/components/ui/AnimatedNumber.js";
import { RiskGauge } from "../src/components/ui/RiskGauge.js";
import { PageTransition, StaggerItem, StaggerList } from "../src/components/ui/PageTransition.js";
import { EmptyState } from "../src/components/EmptyState.js";
import { PageHeader } from "../src/components/ui/PageHeader.js";
import { ExperimentalBadge, ExperimentalNote } from "../src/components/ui/ExperimentalBadge.js";

test("StatCard renderiza valores, subtítulos, iconos, tendencias y variantes de riesgo", () => {
  for (const variant of ["default", "success", "warning", "danger", "cyan", "purple"] as const) {
    for (const direction of ["up", "down", "flat"] as const) {
      const html = renderToStaticMarkup(createElement(StatCard, {
        title: `Indicador ${variant}`,
        value: "72.5 %",
        subtitle: "Último periodo",
        variant,
        trend: { direction, label: `Tendencia ${direction}` },
        animateValue: false,
      }));
      assert.ok(html.includes(`Indicador ${variant}`));
      assert.ok(html.includes("72.5 %"));
      assert.ok(html.includes("Último periodo"));
      assert.ok(html.includes(`Tendencia ${direction}`));
    }
  }
});

test("StatCard conserva valores no numéricos y puede omitir texto opcional", () => {
  const html = renderToStaticMarkup(createElement(StatCard, {
    title: "Estado", value: "Sin datos", animateValue: true,
  }));
  assert.ok(html.includes("Sin datos"));
  assert.ok(!html.includes("Último periodo"));
});

test("BentoCell renderiza clases de tamaño, estado y clase adicional", () => {
  const html = renderToStaticMarkup(createElement(BentoCell, {
    col: 6, row: 2, variant: "hero", delay: 0.1, className: "test-cell",
  }, "Contenido"));
  assert.ok(html.includes("Contenido"));
  assert.ok(html.includes("xl:col-span-6"));
  assert.ok(html.includes("min-h-[280px]"));
  assert.ok(html.includes("bento-cell-hero"));
  assert.ok(html.includes("test-cell"));
});

test("BentoCell aplica variante muted y valores de tamaño predeterminados", () => {
  const html = renderToStaticMarkup(createElement(BentoCell, { variant: "muted" }, "Resumen"));
  assert.ok(html.includes("col-span-12"));
  assert.ok(html.includes("min-h-[120px]"));
  assert.ok(html.includes("bg-[var(--surface-muted)]"));
});

test("AnimatedNumber renderiza formato entero y decimal con sufijo", () => {
  const integer = renderToStaticMarkup(createElement(AnimatedNumber, { value: 42, suffix: " pts" }));
  const decimal = renderToStaticMarkup(createElement(AnimatedNumber, { value: 4.25, decimals: 2, suffix: "%" }));
  assert.ok(integer.includes("0 pts"));
  assert.ok(decimal.includes("0.00%"));
});

test("RiskGauge limita el porcentaje y elige etiqueta, nivel y color neutral o de riesgo", () => {
  const high = renderToStaticMarkup(createElement(RiskGauge, { score: 140, level: "alto" }));
  const low = renderToStaticMarkup(createElement(RiskGauge, { score: -4, level: "bajo", neutral: true, valueLabel: "Sin dato" }));
  const medium = renderToStaticMarkup(createElement(RiskGauge, { score: 52, level: "medio" }));
  assert.ok(high.includes(">100<"));
  assert.ok(high.includes("var(--risk-high)"));
  assert.ok(low.includes("Sin dato"));
  assert.ok(low.includes("var(--chart-primary)"));
  assert.ok(medium.includes("var(--risk-medium)"));
});

test("transiciones y listas animadas renderizan sus hijos y clases", () => {
  const page = renderToStaticMarkup(createElement(PageTransition, { className: "page" }, "Página"));
  const list = renderToStaticMarkup(createElement(StaggerList, { className: "list" }, createElement(StaggerItem, { className: "item" }, "Fila")));
  assert.ok(page.includes("Página") && page.includes("page"));
  assert.ok(list.includes("Fila") && list.includes("list") && list.includes("item"));
});

test("EmptyState renderiza CTA de login, acción personalizada, etiqueta o contenido básico", () => {
  const login = renderToStaticMarkup(createElement(EmptyState, { title: "Sesión", description: "Accede", showLogin: true }));
  const action = renderToStaticMarkup(createElement(EmptyState, {
    title: "Sin filas", description: "Prueba otro filtro", action: createElement("button", null, "Limpiar filtros"),
  }));
  const label = renderToStaticMarkup(createElement(EmptyState, {
    title: "Sin datos", description: "Vuelve luego", actionLabel: "Actualizado hoy",
  }));
  const plain = renderToStaticMarkup(createElement(EmptyState, { title: "Vacío", description: "Nada que mostrar" }));
  assert.ok(login.includes("Iniciar sesión") && login.includes("/login"));
  assert.ok(action.includes("Limpiar filtros"));
  assert.ok(label.includes("Actualizado hoy"));
  assert.ok(plain.includes('role="status"'));
});

test("PageHeader muestra los bloques opcionales cuando se proporcionan", () => {
  const full = renderToStaticMarkup(createElement(PageHeader, {
    eyebrow: "Gestión", title: "Estudiantes", description: "Consulta", badges: createElement("span", null, "12"),
    extra: createElement("p", null, "Contexto"), actions: createElement("button", null, "Nuevo"), className: "header-test",
  }));
  const minimal = renderToStaticMarkup(createElement(PageHeader, { title: "Resumen" }));
  assert.ok(full.includes("Gestión") && full.includes("Estudiantes") && full.includes("Consulta"));
  assert.ok(full.includes("12") && full.includes("Contexto") && full.includes("Nuevo") && full.includes("header-test"));
  assert.ok(minimal.includes("Resumen"));
});

test("ExperimentalBadge y ExperimentalNote respetan trazabilidad sintética y datos reales", () => {
  const compact = renderToStaticMarkup(createElement(ExperimentalBadge, { datasetVersion: "seed-V6", compact: true, className: "badge-test" }));
  const explicit = renderToStaticMarkup(createElement(ExperimentalBadge, { dataMode: "synthetic_scientific" }));
  const real = renderToStaticMarkup(createElement(ExperimentalBadge, { dataMode: "real", datasetVersion: "V6" }));
  const note = renderToStaticMarkup(createElement(ExperimentalNote, { datasetVersion: "V6.1", modelVersion: "v6" }));
  const noNote = renderToStaticMarkup(createElement(ExperimentalNote, { dataMode: "real" }));
  assert.ok(compact.includes("Sintético V6") && compact.includes("badge-test"));
  assert.ok(explicit.includes("Modelo experimental"));
  assert.strictEqual(real, "");
  assert.ok(note.includes("Dataset V6.1") && note.includes("Modelo v6"));
  assert.strictEqual(noNote, "");
});
