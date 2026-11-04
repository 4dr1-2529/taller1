import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthProvider } from "../src/contexts/AuthProvider.js";
import { StudentDashboard } from "../src/components/student/StudentDashboard.js";
import { StudentPredictionView } from "../src/components/student/StudentPredictionView.js";
import { StudentAttendanceView } from "../src/components/student/StudentAttendanceView.js";
import { LearningView } from "../src/components/views/LearningView.js";
import { PredictionHistoryView } from "../src/components/views/PredictionHistoryView.js";

function renderWithAuth(child: React.ReactNode) {
  return renderToStaticMarkup(createElement(AuthProvider, { children: child }));
}

test("StudentDashboard conserva skeleton mientras AuthProvider restaura sesión", () => {
  const html = renderWithAuth(createElement(StudentDashboard));
  assert.ok(html.includes("skeleton"));
});

test("StudentPredictionView conserva carga inicial hasta confirmar el rol", () => {
  const html = renderWithAuth(createElement(StudentPredictionView));
  assert.ok(html.includes("skeleton"));
});

test("StudentAttendanceView muestra filtros personales sin sesión confirmada", () => {
  const html = renderWithAuth(createElement(StudentAttendanceView));
  assert.ok(html.includes("Historial de asistencia"));
  assert.ok(html.includes("Mes"));
});

test("LearningView presenta cursos disponibles para seleccionar durante SSR", () => {
  const html = renderWithAuth(createElement(LearningView, { mode: "materials" }));
  assert.ok(html.includes("Materiales educativos"));
  assert.ok(html.includes("Seleccione un curso"));
});

test("PredictionHistoryView ofrece acceso de inicio de sesión cuando no hay token", () => {
  const html = renderWithAuth(createElement(PredictionHistoryView, { students: [] }));
  assert.ok(html.includes("Historial de predicciones"));
  assert.ok(html.includes("Inicie sesión"));
});


