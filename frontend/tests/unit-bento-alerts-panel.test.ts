import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BentoAlertsPanel } from "../src/components/dashboard/bento/BentoAlertsPanel.js";

test("BentoAlertsPanel presenta estado vacío y riesgos altos y medios", () => {
  const empty = renderToStaticMarkup(createElement(BentoAlertsPanel, { items: [] }));
  assert.match(empty, /Sin alertas activas en el cohorte/);

  const items = [
    { id: "s1", nombres: "Ana", apellidos: "Paz", nivel: "Primaria · 2° A", prediction: { level: "alto", score: 82 } },
    { id: "s2", nombres: "Luis", apellidos: "Sol", nivel: "Secundaria · 3° B", prediction: { level: "medio", score: 64 } },
  ] as any;
  const populated = renderToStaticMarkup(createElement(BentoAlertsPanel, { items }));
  assert.match(populated, /Ana Paz/);
  assert.match(populated, /Luis Sol/);
  assert.match(populated, /82/);
  assert.match(populated, /64/);
});
