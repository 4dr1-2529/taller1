import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BentoAnalyticsPanels } from "../src/components/dashboard/bento/BentoAnalyticsPanels.js";
import { BentoRiskTrend, BentoDistribution, BentoCourseBars } from "../src/components/dashboard/bento/BentoCharts.js";
import { BentoAtRiskList } from "../src/components/dashboard/bento/BentoAtRiskList.js";
import { BentoAlertsPanel } from "../src/components/dashboard/bento/BentoAlertsPanel.js";
import { BentoMlStatus } from "../src/components/dashboard/bento/BentoMlStatus.js";
import { BentoKpiStrip } from "../src/components/dashboard/bento/BentoKpiStrip.js";
import { BentoCell } from "../src/components/dashboard/bento/BentoCell.js";
import { BentoHero } from "../src/components/dashboard/bento/BentoHero.js";
import { BentoDashboard } from "../src/components/dashboard/bento/BentoDashboard.js";

const riskTrend = [{ periodo: "2026-01", riesgoGlobal: 40 }, { periodo: "2026-02", riesgoGlobal: 45 }];
const riskBySection = [{ label: "1° A", alto: 2, medio: 3, bajo: 10, total: 15 }];
const riskByGrado = [{ grado: "1", alto: 2, medio: 3, bajo: 10 }];
const attendanceByGrado = [{ grado: "1", asistencia: 85 }];
const lmsActivityByGrado = [{ grado: "1", alta: 5, media: 5, baja: 5, sin: 0 }];
const alertsBySalonShort = [{ salon: "1A", count: 3 }];
const modelComparison = [{ modelo: "V6", f1: 0.85, accuracy: 0.90 }];
const featureImportance = [{ variable: "asistencia", peso: 0.4 }];
const alertsByLevel = { bajo: 5, medio: 3, alto: 2 };

test("bento: BentoAnalyticsPanels renderiza", () => {
  const html = renderToStaticMarkup(
    createElement(BentoAnalyticsPanels, {
      riskTrend, riskBySection, riskByGrado, attendanceByGrado,
      lmsActivityByGrado, alertsBySalonShort, modelComparison,
      featureImportance, alertsByLevel,
    }),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("bento: BentoRiskTrend renderiza", () => {
  const html = renderToStaticMarkup(createElement(BentoRiskTrend, { data: riskTrend, highRisk: 2 }));
  assert.ok(typeof html === "string" && html.length > 0);
});

test("bento: BentoDistribution renderiza", () => {
  const html = renderToStaticMarkup(
    createElement(BentoDistribution, { data: [{ name: "Alto", value: 2, fill: "#ef4444" }, { name: "Medio", value: 3, fill: "#f59e0b" }, { name: "Bajo", value: 10, fill: "#22c55e" }] }),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("bento: BentoCourseBars renderiza", () => {
  const html = renderToStaticMarkup(
    createElement(BentoCourseBars, { rows: [{ courseId: "c1", nombre: "Matemática", riesgoPromedio: 45, estudiantes: 20 }] }),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("bento: BentoAtRiskList renderiza", () => {
  const html = renderToStaticMarkup(
    createElement(BentoAtRiskList, {
      students: [{ id: "s1", nombres: "Ana", apellidos: "Garcia", seccionId: "s1", prediction: { score: 70, level: "medio" as any, probability: 0.7, factors: [], modelName: "m" } } as any],
    }),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("bento: BentoAlertsPanel renderiza sin items", () => {
  const html = renderToStaticMarkup(createElement(BentoAlertsPanel, { items: [] }));
  assert.ok(typeof html === "string" && html.length > 0);
  assert.ok(html.includes("Sin alertas activas"));
});

test("bento: BentoDashboard renderiza", () => {
  const students = [{ id: "s1", nombres: "Ana", apellidos: "Garcia", seccionId: "s1", prediction: { score: 70, level: "medio" as any, probability: 0.7, factors: [], modelName: "m" } } as any];
  const courses = [{ id: "c1", nombre: "Matemática", seccionId: "s1" } as any];
  const html = renderToStaticMarkup(
    createElement(BentoDashboard, { role: "docente", students, courses }),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});
