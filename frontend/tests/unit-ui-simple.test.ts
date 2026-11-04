import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RiskBadge } from "../src/components/ui/RiskBadge.js";
import { StatusBadge } from "../src/components/ui/StatusBadge.js";
import { SectionHeading } from "../src/components/ui/SectionHeading.js";
import { PageHeader } from "../src/components/ui/PageHeader.js";
import { PageSection } from "../src/components/ui/PageSection.js";
import { ChartCard } from "../src/components/ui/ChartCard.js";
import { BentoHero } from "../src/components/dashboard/bento/BentoHero.js";
import { BentoMlStatus } from "../src/components/dashboard/bento/BentoMlStatus.js";
import { BentoCell } from "../src/components/dashboard/bento/BentoCell.js";

test("RiskBadge: niveles bajo/medio/alto", () => {
  const h1 = renderToStaticMarkup(createElement(RiskBadge, { level: "bajo", score: 20 }));
  assert.ok(h1.includes("bajo") || h1.includes("20"));
  const h2 = renderToStaticMarkup(createElement(RiskBadge, { level: "medio", score: 50 }));
  assert.ok(h2.includes("medio") || h2.includes("50"));
  const h3 = renderToStaticMarkup(createElement(RiskBadge, { level: "alto", score: 80 }));
  assert.ok(h3.includes("alto") || h3.includes("80"));
});

test("StatusBadge: estados", () => {
  const h1 = renderToStaticMarkup(createElement(StatusBadge, { status: "nueva", label: "Nueva" }));
  assert.ok(h1.includes("Nueva"));
  const h2 = renderToStaticMarkup(createElement(StatusBadge, { status: "en_seguimiento", label: "En seguimiento" }));
  assert.ok(h2.includes("En seguimiento"));
  const h3 = renderToStaticMarkup(createElement(StatusBadge, { status: "resuelta", label: "Resuelta" }));
  assert.ok(h3.includes("Resuelta"));
});

test("SectionHeading: renderiza título", () => {
  const html = renderToStaticMarkup(createElement(SectionHeading, { title: "Mis datos", description: "Subtítulo" }));
  assert.ok(html.includes("Mis datos"));
  assert.ok(html.includes("Subtítulo"));
});

test("PageHeader: renderiza eyebrow, title y description", () => {
  const html = renderToStaticMarkup(
    createElement(PageHeader, { eyebrow: "Ojo", title: "Título", description: "Descripción" }),
  );
  assert.ok(html.includes("Ojo"));
  assert.ok(html.includes("Título"));
  assert.ok(html.includes("Descripción"));
});

test("PageSection: renderiza children", () => {
  const html = renderToStaticMarkup(
    createElement(PageSection, null, createElement("p", null, "contenido de prueba")),
  );
  assert.ok(html.includes("contenido de prueba"));
});

test("ChartCard: renderiza title y children", () => {
  const html = renderToStaticMarkup(
    createElement(ChartCard, { title: "Gráfico de prueba" }, createElement("div", null, "chart")),
  );
  assert.ok(html.includes("Gráfico de prueba"));
  assert.ok(html.includes("chart"));
});

test("BentoHero: renderiza métricas", () => {
  const html = renderToStaticMarkup(
    createElement(BentoHero, {
      greeting: "Panorama de riesgo",
      globalRisk: 42,
      alerts: 3,
      healthScore: 75,
      trend: { direction: "flat", label: "Riesgo estable" },
    }),
  );
  assert.ok(html.includes("42") || html.includes("3") || html.includes("75") || html.includes("Panorama"));
});

test("BentoMlStatus: renderiza estado ML", () => {
  const html = renderToStaticMarkup(
    createElement(BentoMlStatus, {
      ml: {
        dataMode: "synthetic_scientific",
        modelSelected: "Modelo V6",
        modelVersion: "1.0",
      },
    }),
  );
  assert.ok(html.includes("Modelo V6") || html.includes("1.0") || html.includes("Estado del modelo"));
});

test("BentoCell: renderiza contenido", () => {
  const html = renderToStaticMarkup(createElement(BentoCell, null, createElement("span", null, "celda")));
  assert.ok(html.includes("celda"));
});
