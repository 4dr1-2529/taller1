import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Skeleton, CardSkeleton, TableSkeleton } from "../src/components/ui/Skeleton.js";
import { ErrorState } from "../src/components/ui/ErrorState.js";
import { ConfirmDialog } from "../src/components/ui/ConfirmDialog.js";
import { StatusBadge } from "../src/components/ui/StatusBadge.js";
import { AttendanceEstado, estadoToFlags, flagsToEstado, estadoLabel, estadoBadgeClass } from "../src/lib/attendance-status.js";
import { formatContributionPoints, dataModeLabel } from "../src/lib/prediction-display.js";
import { getEligibleStudents } from "../src/lib/enrollment-eligibility.js";
import { dashboardGreeting, buildRiskHistorySeries } from "../src/lib/dashboard-data.js";
import {
  lmsCompositeScore,
  deriveLmsEngagementLevel,
  lmsActivityTierFromLevel,
  lmsActivityTierFromMetrics,
} from "../src/lib/lms-engagement.js";
import { resolveHistorySearchFilters, buildHistoryQuery } from "../src/lib/prediction-history-search.js";
import { getRoleLabel } from "../src/lib/role-labels.js";
import { INPUT_CLASS, SELECT_CLASS, TEXTAREA_CLASS } from "../src/lib/ui.js";

test("Skeleton renderiza con className", () => {
  const html = renderToStaticMarkup(createElement(Skeleton, { className: "w-full" }));
  assert.ok(html.includes("w-full"));
  assert.ok(html.includes("skeleton"));
});

test("Skeleton sin className", () => {
  const html = renderToStaticMarkup(createElement(Skeleton, {}));
  assert.ok(html.includes("skeleton"));
});

test("CardSkeleton renderiza esqueletos internos", () => {
  const html = renderToStaticMarkup(createElement(CardSkeleton));
  assert.ok(html.includes("skeleton"));
});

test("TableSkeleton renderiza filas y columnas", () => {
  const html = renderToStaticMarkup(createElement(TableSkeleton, { rows: 2, cols: 3 }));
  assert.ok(html.includes("skeleton"));
  assert.ok(html.includes("Cargando tabla"));
});

test("ErrorState renderiza mensaje y título", () => {
  const html = renderToStaticMarkup(createElement(ErrorState, { title: "Error", message: "Algo falló" }));
  assert.ok(html.includes("Error"));
  assert.ok(html.includes("Algo falló"));
});

test("ErrorState con onRetry", () => {
  let clicked = false;
  const html = renderToStaticMarkup(
    createElement(ErrorState, { message: "Fallo", onRetry: () => { clicked = true; }, retryLabel: "Reintentar" }),
  );
  assert.ok(html.includes("Reintentar"));
});

test("ConfirmDialog renderiza cuando está abierto", () => {
  let confirmed = false;
  const html = renderToStaticMarkup(
    createElement(ConfirmDialog, {
      open: true,
      title: "¿Seguro?",
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Sí, eliminar",
      onConfirm: () => { confirmed = true; },
      onClose: () => {},
    }),
  );
  assert.ok(html.includes("¿Seguro?"));
  assert.ok(html.includes("Esta acción no se puede deshacer."));
  assert.ok(html.includes("Sí, eliminar"));
});

test("ConfirmDialog no renderiza contenido cuando está cerrado", () => {
  const html = renderToStaticMarkup(
    createElement(ConfirmDialog, {
      open: false,
      title: "X",
      description: "Y",
      confirmLabel: "OK",
      onConfirm: () => {},
      onClose: () => {},
    }),
  );
  assert.ok(!html.includes("X"));
});

test("StatusBadge renderiza estados", () => {
  const htmlNueva = renderToStaticMarkup(createElement(StatusBadge, { status: "nueva", label: "Nueva" }));
  assert.ok(htmlNueva.includes("Nueva"));
  const htmlEnSeguimiento = renderToStaticMarkup(createElement(StatusBadge, { status: "en_seguimiento", label: "En seguimiento" }));
  assert.ok(htmlEnSeguimiento.includes("En seguimiento"));
  const htmlResuelta = renderToStaticMarkup(createElement(StatusBadge, { status: "resuelta", label: "Resuelta" }));
  assert.ok(htmlResuelta.includes("Resuelta"));
});

test("attendance-status: estadoToFlags todos los estados", () => {
  assert.deepStrictEqual(estadoToFlags("presente"), { presente: true, tardanza: false, justificado: false });
  assert.deepStrictEqual(estadoToFlags("tardanza"), { presente: true, tardanza: true, justificado: false });
  assert.deepStrictEqual(estadoToFlags("falta"), { presente: false, tardanza: false, justificado: false });
  assert.deepStrictEqual(estadoToFlags("falta_justificada"), { presente: false, tardanza: false, justificado: true });
});

test("attendance-status: flagsToEstado", () => {
  assert.strictEqual(flagsToEstado({ presente: true, tardanza: true, justificado: false }), "tardanza");
  assert.strictEqual(flagsToEstado({ presente: true, tardanza: false, justificado: false }), "presente");
  assert.strictEqual(flagsToEstado({ presente: false, tardanza: false, justificado: true }), "falta_justificada");
  assert.strictEqual(flagsToEstado({ presente: false, tardanza: false, justificado: false }), "falta");
});

test("attendance-status: estadoLabel y estadoBadgeClass", () => {
  assert.strictEqual(estadoLabel("presente"), "Asistió");
  assert.strictEqual(estadoLabel("desconocido"), "desconocido");
  assert.strictEqual(estadoBadgeClass("falta"), "status-chip status-chip--danger");
  assert.strictEqual(estadoBadgeClass("falta_justificada"), "status-chip status-chip--info");
});

test("prediction-display: formatContributionPoints y dataModeLabel", () => {
  assert.strictEqual(formatContributionPoints(25.7), "26 pts");
  assert.strictEqual(dataModeLabel(undefined), "—");
  assert.strictEqual(dataModeLabel(null), "—");
  assert.strictEqual(dataModeLabel("synthetic_scientific"), "Sintético científico (V6)");
  assert.strictEqual(dataModeLabel("real"), "Institucional real");
  assert.strictEqual(dataModeLabel("synthetic"), "Sintético");
  assert.strictEqual(dataModeLabel("otro"), "otro");
});

test("enrollment-eligibility: getEligibleStudents", () => {
  const candidates = [{ id: "s1" } as any, { id: "s2" } as any, { id: "s3" } as any];
  assert.strictEqual(getEligibleStudents(candidates, ["s1"]).length, 2);
  assert.strictEqual(getEligibleStudents(candidates, new Set(["s2", "s3"])).length, 1);
  assert.strictEqual(getEligibleStudents(candidates, null).length, 3);
  assert.strictEqual(getEligibleStudents(candidates, undefined).length, 3);
  assert.strictEqual(getEligibleStudents([], ["s1"]).length, 0);
});

test("dashboard-data: dashboardGreeting y buildRiskHistorySeries", () => {
  assert.strictEqual(dashboardGreeting("admin"), "Panel del director — riesgo de deserción institucional");
  assert.strictEqual(dashboardGreeting("docente"), "Seguimiento de tus estudiantes y cursos");
  assert.strictEqual(dashboardGreeting("estudiante"), "Tu rendimiento y nivel de riesgo");
  assert.strictEqual(dashboardGreeting("desconocido"), "Panel del director — riesgo de deserción institucional");
  assert.deepStrictEqual(buildRiskHistorySeries(), []);
});

test("lms-engagement: lmsCompositeScore", () => {
  assert.strictEqual(lmsCompositeScore([]), 0);
  assert.strictEqual(lmsCompositeScore([{ actividadPct: 60, minutos: 0, conexiones: 0 }]), 20);
  assert.ok(Math.abs(lmsCompositeScore([{ actividadPct: 100 }, { actividadPct: 0 }]) - 16.67) < 0.01);
});

test("lms-engagement: deriveLmsEngagementLevel", () => {
  assert.strictEqual(deriveLmsEngagementLevel([{ actividadPct: 90, minutos: 180, conexiones: 13 }]), "alto");
  assert.strictEqual(deriveLmsEngagementLevel([{ actividadPct: 80, minutos: 90, conexiones: 5 }]), "medio");
  assert.strictEqual(deriveLmsEngagementLevel([{ actividadPct: 10 }]), "bajo");
});

test("lms-engagement: lmsActivityTierFromLevel y FromMetrics", () => {
  assert.strictEqual(lmsActivityTierFromLevel("alto"), "alta");
  assert.strictEqual(lmsActivityTierFromLevel("alta"), "alta");
  assert.strictEqual(lmsActivityTierFromLevel("medio"), "media");
  assert.strictEqual(lmsActivityTierFromLevel("bajo"), "baja");
  assert.strictEqual(lmsActivityTierFromLevel("desconocido"), "sin");
  assert.strictEqual(lmsActivityTierFromMetrics(undefined, [], undefined), "sin");
  assert.strictEqual(lmsActivityTierFromMetrics("alto", [{ actividadPct: 90 }], undefined), "alta");
});

test("prediction-history-search: resolveHistorySearchFilters y buildHistoryQuery", () => {
  const draft: any = { gradoId: "1", seccionId: "", search: "  ana  ", riskLevel: "" };
  const resolved = resolveHistorySearchFilters(draft);
  assert.deepStrictEqual(resolved, { gradoId: "1", seccionId: "", search: "  ana  ", riskLevel: "" });
  const query = buildHistoryQuery(draft);
  assert.deepStrictEqual(query, { gradoId: "1", seccionId: undefined, cursoId: undefined, riskLevel: undefined, search: "ana" });
});

test("role-labels: getRoleLabel", () => {
  assert.strictEqual(getRoleLabel("admin"), "Director");
  assert.strictEqual(getRoleLabel("docente"), "Profesor");
  assert.strictEqual(getRoleLabel("estudiante"), "Estudiante");
  assert.strictEqual(getRoleLabel("otro"), "otro");
});

test("ui: constantes de clases CSS", () => {
  assert.strictEqual(INPUT_CLASS, "input-premium");
  assert.strictEqual(SELECT_CLASS, "input-premium");
  assert.strictEqual(TEXTAREA_CLASS, "input-premium min-h-[88px] resize-y");
});
