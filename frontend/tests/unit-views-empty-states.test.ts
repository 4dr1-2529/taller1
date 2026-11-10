import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthContext } from "../src/contexts/AuthProvider.js";
import { defaultStudentForm } from "../src/components/views/StudentsView.js";
import { defaultTeacherForm } from "../src/components/views/TeachersView.js";

const unauthenticated = {
  user: null,
  token: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
  isAuthenticated: false,
  hasRole: () => false,
  isAdmin: false,
  isDocente: false,
  isEstudiante: false,
};

function withAuth(children: React.ReactNode) {
  return createElement(AuthContext.Provider, { value: unauthenticated }, children);
}

test("StudentsView muestra el estado vacío sin habilitar el formulario de edición", async () => {
  const { StudentsView } = await import("../src/components/views/StudentsView.js");
  const html = renderToStaticMarkup(createElement(StudentsView, {
    students: [],
    secciones: [],
    newStudent: defaultStudentForm,
    setNewStudent: () => {},
    onAddStudent: () => {},
    canEdit: false,
  }));

  assert.match(html, /No hay estudiantes registrados\./);
  assert.doesNotMatch(html, /Registrar estudiante/);
});

test("TeachersView muestra el estado vacío para un usuario de solo lectura", async () => {
  const { TeachersView } = await import("../src/components/views/TeachersView.js");
  const html = renderToStaticMarkup(createElement(TeachersView, {
    teachers: [],
    secciones: [],
    form: defaultTeacherForm,
    setForm: () => {},
    onSubmit: () => {},
    onUpdate: async () => {},
    onDeactivate: async () => {},
    onCreateAccount: async () => {},
    canEdit: false,
  }));

  assert.match(html, /Sin docentes registrados\./);
  assert.doesNotMatch(html, /Registrar docente/);
});

test("PredictionView explica por qué no se puede generar una predicción sin estudiantes", async () => {
  const { PredictionView } = await import("../src/components/views/PredictionView.js");
  const html = renderToStaticMarkup(createElement(PredictionView, { students: [] }));

  assert.match(html, /No hay estudiantes disponibles en su alcance\./);
  assert.match(html, /disabled=""/);
});

test("AlertsView presenta su estado vacío cuando no hay estudiantes", async () => {
  const { AlertsView } = await import("../src/components/views/AlertsView.js");
  const html = renderToStaticMarkup(withAuth(createElement(AlertsView, { students: [] })));

  assert.match(html, /No hay estudiantes en alerta\./);
});

test("AttendanceView y GradesView solicitan sesión antes de mostrar controles", async () => {
  const [{ AttendanceView }, { GradesView }] = await Promise.all([
    import("../src/components/views/AttendanceView.js"),
    import("../src/components/views/GradesView.js"),
  ]);
  const attendanceHtml = renderToStaticMarkup(withAuth(createElement(AttendanceView, { students: [] })));
  const gradesHtml = renderToStaticMarkup(withAuth(createElement(GradesView, {
    students: [], courses: [], teachers: [], secciones: [],
  })));

  assert.match(attendanceHtml, /Control de asistencia/);
  assert.match(gradesHtml, /Registro de notas/);
  assert.doesNotMatch(gradesHtml, /Guardar nota/);
});

test("LearningView representa la carga inicial sin inventar cursos", async () => {
  const { LearningView } = await import("../src/components/views/LearningView.js");
  const html = renderToStaticMarkup(withAuth(createElement(LearningView, { mode: "courses" })));

  assert.match(html, /Mis cursos/);
  assert.doesNotMatch(html, /Sin cursos asignados/);
});

test("ProfessorAlertsView representa su estado inicial sin resultados del servidor", async () => {
  const { ProfessorAlertsView } = await import("../src/components/views/ProfessorAlertsView.js");
  const html = renderToStaticMarkup(withAuth(createElement(ProfessorAlertsView, { courses: [], secciones: [] })));

  assert.match(html, /Listado de alertas/);
  assert.match(html, /Configure los filtros y presione Buscar\./);
});
