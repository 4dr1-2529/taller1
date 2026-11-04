import test from "node:test";
import assert from "node:assert/strict";
import { groupsForSections, SECTION_BREADCRUMB, SIDEBAR_GROUPS } from "../src/data/sidebar-nav.js";

test("groupsForSections conserva orden y filtra grupos sin secciones visibles", () => {
  const groups = groupsForSections(["Dashboard", "Asistencia", "Alertas"]);
  assert.deepStrictEqual(groups.map((group) => group.id), ["overview", "academic", "ai"]);
  assert.deepStrictEqual(groups.map((group) => group.items), [["Dashboard"], ["Asistencia"], ["Alertas"]]);
  assert.deepStrictEqual(groupsForSections([]), []);
  assert.strictEqual(SIDEBAR_GROUPS.length, 4);
});

test("cada sección tiene una ruta de breadcrumbs con contexto y destino", () => {
  for (const group of SIDEBAR_GROUPS) {
    for (const section of group.items) {
      assert.ok(SECTION_BREADCRUMB[section]?.length >= 2, `breadcrumb ausente: ${section}`);
    }
  }
  assert.deepStrictEqual(SECTION_BREADCRUMB["Historial predicciones"], ["IA", "Historial"]);
});
