import test from "node:test";
import assert from "node:assert/strict";
import {
  ATTENDANCE_ESTADOS,
  estadoBadgeClass,
  estadoLabel,
  estadoToFlags,
  flagsToEstado,
  type AttendanceEstado,
} from "../src/lib/attendance-status.js";

const cases: Array<[
  AttendanceEstado,
  { presente: boolean; tardanza: boolean; justificado: boolean },
  string,
  string,
]> = [
  ["presente", { presente: true, tardanza: false, justificado: false }, "Asistió", "status-chip status-chip--success"],
  ["tardanza", { presente: true, tardanza: true, justificado: false }, "Tardanza", "status-chip status-chip--warning"],
  ["falta", { presente: false, tardanza: false, justificado: false }, "Falta", "status-chip status-chip--danger"],
  ["falta_justificada", { presente: false, tardanza: false, justificado: true }, "Falta justificada", "status-chip status-chip--info"],
];

test("estados de asistencia exponen etiquetas y ayudas para las cuatro opciones", () => {
  assert.deepStrictEqual(ATTENDANCE_ESTADOS.map(({ value }) => value), cases.map(([estado]) => estado));
  for (const [, , label] of cases) {
    assert.ok(ATTENDANCE_ESTADOS.some((item) => item.label === label && item.hint.length > 0));
  }
});

test("estadoToFlags y flagsToEstado mantienen la representación canónica", () => {
  for (const [estado, flags] of cases) {
    assert.deepStrictEqual(estadoToFlags(estado), flags);
    assert.strictEqual(flagsToEstado(flags), estado);
  }
});

test("flagsToEstado prioriza tardanza y asistencia sobre justificación", () => {
  assert.strictEqual(flagsToEstado({ presente: true, tardanza: true, justificado: true }), "tardanza");
  assert.strictEqual(flagsToEstado({ presente: true, tardanza: false, justificado: true }), "presente");
  assert.strictEqual(flagsToEstado({ presente: false, tardanza: false, justificado: true }), "falta_justificada");
  assert.strictEqual(flagsToEstado({ presente: false, tardanza: false, justificado: false }), "falta");
});

test("labels y clases CSS corresponden a cada estado", () => {
  for (const [estado, , label, badgeClass] of cases) {
    assert.strictEqual(estadoLabel(estado), label);
    assert.strictEqual(estadoBadgeClass(estado), badgeClass);
  }
});
