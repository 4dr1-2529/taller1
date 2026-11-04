import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthProvider } from "../src/contexts/AuthProvider.js";
import { AlertsView } from "../src/components/views/AlertsView.js";

function render(students: any[], useApi = false) {
  return renderToStaticMarkup(createElement(AuthProvider, null, createElement(AlertsView, {
    students, teachers: [], secciones: [], useApi,
  })));
}
const student = (level: string, score: number) => ({
  id: `s-${level}`, codigo: `EST-${level}`, nombres: "Ana", apellidos: level,
  storedPrediction: { level, score, probability: score / 100, factors: [{ key: "attendance", label: "Asistencia", contribution: 12 }] },
}) as any;

test("AlertsView SSR muestra ausencia de alertas y excluye el riesgo bajo del listado", () => {
  const empty = render([]);
  assert.match(empty, /Alertas que requieren acción/);
  assert.match(empty, /No hay estudiantes en alerta/);
  const lowOnly = render([student("bajo", 20)]);
  assert.match(lowOnly, /No hay estudiantes en alerta/);
  assert.doesNotMatch(lowOnly, /Ana bajo/);
});

test("AlertsView SSR presenta riesgos medios y altos desde predicciones almacenadas", () => {
  const html = render([student("medio", 50), student("alto", 80)]);
  assert.match(html, /Ana medio/);
  assert.match(html, /Ana alto/);
  assert.match(html, /Asistencia · 12 pts/);
});

test("AlertsView SSR muestra empty state de API cuando la consulta inicia vacía", () => {
  const html = render([], true);
  assert.match(html, /Incluir resueltas/);
  assert.match(html, /Sin alertas para este filtro/);
});
