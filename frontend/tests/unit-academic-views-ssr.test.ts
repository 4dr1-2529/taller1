import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthProvider } from "../src/contexts/AuthProvider.js";
import { GradesView } from "../src/components/views/GradesView.js";
import { AttendanceView } from "../src/components/views/AttendanceView.js";
import { EnrollmentsView } from "../src/components/views/EnrollmentsView.js";

const noOp = () => undefined;
const form = { estudianteId: "", seccionId: "", anioLectivoId: "" };
const renderAuthenticatedShell = (node: React.ReactNode) => renderToStaticMarkup(createElement(AuthProvider, null, node));

test("GradesView SSR conserva el control de acceso cuando no hay sesión", () => {
  const html = renderAuthenticatedShell(createElement(GradesView, { students: [], courses: [], teachers: [], secciones: [] }));
  assert.match(html, /Registro de notas/);
  assert.match(html, /Inicie sesión para registrar calificaciones/);
  assert.match(html, /Iniciar sesión/);
  assert.doesNotMatch(html, /Guardar nota/);
});

test("AttendanceView SSR conserva el control de acceso cuando no hay sesión", () => {
  const html = renderAuthenticatedShell(createElement(AttendanceView, { students: [], courses: [], teachers: [], secciones: [] }));
  assert.match(html, /Control de asistencia/);
  assert.match(html, /Registre la asistencia diaria por salón/);
  assert.match(html, /Iniciar sesión/);
  assert.doesNotMatch(html, /Guardar asistencia/);
});

test("EnrollmentsView SSR handles empty data, null stats and required form callbacks", () => {
  const html = renderToStaticMarkup(createElement(EnrollmentsView, {
    students: [], secciones: [], matriculaStats: null, form,
    setForm: noOp, onAdd: noOp, onRefresh: noOp,
  }));
  assert.match(html, /Matrículas 2026 \(0\)/);
  assert.match(html, /Sin registros en esta tabla/);
  assert.match(html, /Sin matrículas para el filtro seleccionado/);
});
