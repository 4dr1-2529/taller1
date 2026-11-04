import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { api } from "../src/services/api.js";
import { estudianteService } from "../src/services/estudianteService.js";
import { AuthContext } from "../src/contexts/AuthProvider.js";

const origGetTeacherAssignments = api.getTeacherAssignments.bind(api);
const origGetCursosCatalogo = api.getCursosCatalogo.bind(api);
const origGetDashboardKpis = api.getDashboardKpis.bind(api);
const origGetPerfil = estudianteService.getPerfil.bind(estudianteService);
const origGetDashboard = estudianteService.getDashboard.bind(estudianteService);

function restoreApi() {
  api.getTeacherAssignments = origGetTeacherAssignments;
  api.getCursosCatalogo = origGetCursosCatalogo;
  api.getDashboardKpis = origGetDashboardKpis;
  estudianteService.getPerfil = origGetPerfil;
  estudianteService.getDashboard = origGetDashboard;
}

const authValue = {
  user: { sub: "1", role: "estudiante", email: "a@b.com", nombres: "Ana", apellidos: "G" },
  token: null, loading: false, login: async () => {}, logout: async () => {}, refresh: async () => {},
  isAuthenticated: true, hasRole: () => true, isAdmin: false, isDocente: false, isEstudiante: true,
};

function withAuth(children: React.ReactNode) {
  return createElement(AuthContext.Provider, { value: authValue }, children);
}

test("view: TeacherAssignmentsView renderiza", async () => {
  api.getTeacherAssignments = async () => ({ items: [] });
  api.getCursosCatalogo = async () => ({ items: [] });

  const { TeacherAssignmentsView } = await import("../src/components/views/TeacherAssignmentsView.js");
  const html = renderToStaticMarkup(
    createElement(TeacherAssignmentsView, {
      teachers: [],
      secciones: [{ id: "s1", gradoId: 1, gradoLabel: "1° A", nombre: "A" }],
    }),
  );
  assert.ok(typeof html === "string" && html.length > 0);
  restoreApi();
});

test("view: StudentDashboard con AuthProvider renderiza sin error", async () => {
  estudianteService.getDashboard = async () => ({
    profile: { id: 1n, nombres: "Ana", apellidos: "G", codigo: "001", seccionId: "s1" },
    kpis: { grado: "1", salon: "A", promedioGeneral: 14, asistenciaGeneral: 90, nivelRiesgo: "medio", alertasActivas: 0 },
    resumen: { ultimaPrediccion: null, ultimaNota: null, ultimaAsistencia: null, ultimaActividadLms: null },
    alertasPreview: [],
  });

  const { StudentDashboard } = await import("../src/components/student/StudentDashboard.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(StudentDashboard)),
  );
  assert.ok(typeof html === "string" && html.length > 0);
  restoreApi();
});

test("view: StudentDashboard con datos nulos renderiza sin error", async () => {
  estudianteService.getDashboard = async () => null;

  const { StudentDashboard } = await import("../src/components/student/StudentDashboard.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(StudentDashboard)),
  );
  assert.ok(typeof html === "string" && html.length > 0);
  restoreApi();
});
