import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

function src(rel: string): string {
  return readFileSync(join(root, rel), "utf-8");
}

const FORBIDDEN_UI = ["npm run ml:train", "puerto 5000", "localhost:5000", "python train.py"];

test("la UI de estado ML nunca expone textos técnicos", () => {
  const content = src(join("components", "views", "MlMetricsSection.tsx"));
  for (const needle of FORBIDDEN_UI) {
    assert.ok(!content.includes(needle), `texto técnico visible: ${needle}`);
  }
  assert.ok(content.includes("aún no disponibles"));
  assert.ok(content.includes("Intente nuevamente"));
});

test("ninguna vista expone comandos internos ni puertos", () => {
  const views = [
    "PredictionView.tsx",
    "ProfessorPredictionView.tsx",
    "AlertsView.tsx",
    "ProfessorAlertsView.tsx",
    "ReportsView.tsx",
  ];
  for (const view of views) {
    const content = src(join("components", "views", view));
    assert.ok(!content.includes("npm run ml:train"), `${view}: npm`);
    assert.ok(!content.includes("localhost:5000"), `${view}: localhost`);
  }
});
