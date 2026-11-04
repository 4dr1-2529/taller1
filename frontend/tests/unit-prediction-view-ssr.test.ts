import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PredictionView } from "../src/components/views/PredictionView.js";

const student = { id: "s-5", codigo: "EST-005", nombres: "Rosa", apellidos: "Luz" } as any;
function render(students: any[]) {
  return renderToStaticMarkup(createElement(PredictionView, { students }));
}

test("PredictionView SSR ofrece estudiantes y explica que la predicción se ejecuta al solicitarla", () => {
  const html = render([student]);
  assert.match(html, /Evaluación individual de riesgo/);
  assert.match(html, /Generar estimación/);
  assert.match(html, /EST-005 · Rosa Luz/);
  assert.match(html, /Generar predicción/);
  assert.match(html, /Aún no se ha generado una estimación/);
  assert.match(html, /modelo experimental/i);
  assert.strictEqual((html.match(/skeleton h-4/g) ?? []).length, 2);
});

test("PredictionView SSR representa el estado sin estudiantes sin habilitar predicciones", () => {
  const html = render([]);
  assert.match(html, /Seleccione un estudiante/);
  assert.match(html, /No hay estudiantes disponibles en su alcance/);
  assert.match(html, /Sin estudiantes en su alcance/);
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /Aún no se ha generado una estimación/);
});
