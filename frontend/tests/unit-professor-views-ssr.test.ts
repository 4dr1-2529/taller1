import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfessorAlertsView } from "../src/components/views/ProfessorAlertsView.js";
import { ProfessorGradesView } from "../src/components/views/ProfessorGradesView.js";
import { TeacherAssignmentsView } from "../src/components/views/TeacherAssignmentsView.js";

const sections = [{ id: "sec-1", gradoId: "2", gradoLabel: "Segundo", numero: 2, nombre: "A" }] as any;
const courses = [{ id: "course-1", nombre: "Matemática", codigo: "MAT", seccionId: "sec-1", profesorId: "t-1", activo: true }] as any;
const teachers = [{ id: "t-1", nombres: "Luis", apellidos: "Sol", codigo: "DOC-1", especialidad: "Matemática", correo: "luis@example.edu", telefono: "", courses: [] }] as any;

test("ProfessorAlertsView presenta controles y estado inicial sin buscar", () => {
  const html = renderToStaticMarkup(createElement(ProfessorAlertsView, { courses, secciones: sections }));
  assert.ok(html.includes("Ver todas mis alertas"));
  assert.ok(html.includes("Incluir resueltas"));
  assert.ok(html.includes("Presione Buscar") || html.includes("presione Buscar"));
});

test("ProfessorGradesView muestra filtros y estado inicial vacío", () => {
  const html = renderToStaticMarkup(createElement(ProfessorGradesView, { courses, secciones: sections }));
  assert.ok(html.includes("Registro de notas"));
  assert.ok(html.includes("Buscar"));
  assert.ok(html.includes("Grado"));
});

test("TeacherAssignmentsView muestra carga inicial y opciones del formulario", () => {
  const html = renderToStaticMarkup(createElement(TeacherAssignmentsView, { teachers, secciones: sections }));
  assert.ok(html.includes("Nueva asignación docente"));
  assert.ok(html.includes("Crear asignación"));
  assert.ok(html.includes("Seleccione un profesor"));
});

import { BentoAnalyticsPanels } from "../src/components/dashboard/bento/BentoAnalyticsPanels.js";
import { BentoDashboard } from "../src/components/dashboard/bento/BentoDashboard.js";

test("BentoAnalyticsPanels comunica datos insuficientes para series vacías", () => {
  const html = renderToStaticMarkup(createElement(BentoAnalyticsPanels, {
    riskTrend: [], riskBySection: [], riskByGrado: [], attendanceByGrado: [],
    lmsActivityByGrado: [], alertsBySalonShort: [], modelComparison: [], featureImportance: [],
  }));
  assert.ok(html.includes("Evolución del riesgo"));
  assert.ok(html.includes("No hay información suficiente"));
  assert.ok(html.includes("Importancia de variables"));
});

test("BentoDashboard representa el panel director sin datos reales inventados", () => {
  const html = renderToStaticMarkup(createElement(BentoDashboard, { role: "admin", students: [], courses: [], useApi: false }));
  assert.ok(html.includes("Resumen") || html.includes("Riesgo"));
  assert.ok(html.includes("Sin datos") || html.includes("sin datos") || html.includes("Sin estudiantes"));
});
import { ProfessorPredictionView } from "../src/components/views/ProfessorPredictionView.js";
import { ProfessorAttendanceView } from "../src/components/views/ProfessorAttendanceView.js";

test("ProfessorPredictionView ofrece filtros y estado previo a la búsqueda", () => {
  const html = renderToStaticMarkup(createElement(ProfessorPredictionView, { courses, secciones: sections }));
  assert.ok(html.includes("Buscar"));
  assert.ok(html.includes("Predicción") || html.includes("estudiantes"));
});

test("ProfessorAttendanceView representa captura docente sin estudiantes consultados", () => {
  const html = renderToStaticMarkup(createElement(ProfessorAttendanceView, { courses, secciones: sections }));
  assert.ok(html.includes("Asistencia"));
  assert.ok(html.includes("Buscar"));
  assert.ok(html.includes("Seleccione") || html.includes("No hay"));
});
