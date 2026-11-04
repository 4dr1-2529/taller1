import test from "node:test";
import assert from "node:assert/strict";
import { buildRiskHistorySeries, dashboardGreeting } from "../src/lib/dashboard-data.js";

test("dashboardGreeting muestra el mensaje adecuado para cada rol y usa director como respaldo", () => {
  assert.strictEqual(dashboardGreeting("admin"), "Panel del director — riesgo de deserción institucional");
  assert.strictEqual(dashboardGreeting("docente"), "Seguimiento de tus estudiantes y cursos");
  assert.strictEqual(dashboardGreeting("estudiante"), "Tu rendimiento y nivel de riesgo");
  assert.strictEqual(dashboardGreeting("rol_nuevo"), dashboardGreeting("admin"));
});

test("buildRiskHistorySeries no inventa una serie local", () => {
  assert.deepStrictEqual(buildRiskHistorySeries(), []);
});
