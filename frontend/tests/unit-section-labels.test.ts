import test from "node:test";
import assert from "node:assert/strict";
import { ENTIDAD_LABELS, getEntidadLabel, getSectionLabel, SECTION_LABELS } from "../src/data/section-labels.js";

test("getSectionLabel aplica etiquetas específicas de estudiantes y mantiene las restantes", () => {
  assert.strictEqual(getSectionLabel("Notas", "estudiante"), "Mis notas");
  assert.strictEqual(getSectionLabel("Asistencia", "estudiante"), "Mi asistencia");
  assert.strictEqual(getSectionLabel("Actividad LMS", "estudiante"), "Mi actividad LMS");
  assert.strictEqual(getSectionLabel("Predicción", "estudiante"), "Mi riesgo");
  assert.strictEqual(getSectionLabel("Alertas", "estudiante"), "Mis alertas");
  assert.strictEqual(getSectionLabel("Dashboard", "estudiante"), "Dashboard");
});

test("getSectionLabel aplica etiquetas docentes y devuelve etiqueta general para roles restantes", () => {
  assert.strictEqual(getSectionLabel("Estudiantes", "docente"), "Mis estudiantes");
  assert.strictEqual(getSectionLabel("Cursos", "docente"), "Mis cursos");
  assert.strictEqual(getSectionLabel("Reportes", "docente"), "Mis reportes");
  assert.strictEqual(getSectionLabel("Estudiantes", "admin"), SECTION_LABELS.Estudiantes);
  assert.strictEqual(getSectionLabel("Reportes"), "Reportes");
});

test("getEntidadLabel conoce las entidades auditadas y conserva entidades nuevas", () => {
  for (const [key, label] of Object.entries(ENTIDAD_LABELS)) assert.strictEqual(getEntidadLabel(key), label);
  assert.strictEqual(getEntidadLabel("UnknownEntity"), "UnknownEntity");
});
