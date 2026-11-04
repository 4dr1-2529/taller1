import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { api } from "../src/services/api.js";
import { estudianteService } from "../src/services/estudianteService.js";
import { AuthContext } from "../src/contexts/AuthProvider.js";

const authValue = {
  user: { sub: "1", role: "estudiante", email: "a@b.com", nombres: "Ana", apellidos: "G" },
  token: null, loading: false, login: async () => {}, logout: async () => {}, refresh: async () => {},
  isAuthenticated: true, hasRole: () => true, isAdmin: false, isDocente: false, isEstudiante: true,
};

function withAuth(children: React.ReactNode) {
  return createElement(AuthContext.Provider, { value: authValue }, children);
}

const students = [{ id: "s1", codigo: "001", nombres: "Ana", apellidos: "G", seccionId: "s1", estado: "activa", dni: "12345678", promedioGeneral: 14, asistenciaGeneral: 90, hasGrades: true, hasAttendance: true, storedPrediction: { score: 70, level: "medio", probability: 0.7, factors: [], modelName: "m" }, metrics: { promedioGeneral: 14, asistenciaGeneral: 90, lms: { actividadSemanalPct: [50], minutosPorSemana: [120], horasPlataformaSemana: 5 } } } as any];
const courses = [{ id: "c1", nombre: "Matemática", seccionId: "s1" } as any];
const teachers = [{ id: "t1", nombres: "Prof", apellidos: "X", codigo: "T001" } as any];
const secciones = [{ id: "s1", gradoId: 1, gradoLabel: "1° A", nombre: "A" }];

// view: GradesView
test("view: GradesView renderiza sin error", async () => {
  const { GradesView } = await import("../src/components/views/GradesView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(GradesView, { students, courses, teachers, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

// view: AlertsView
test("view: AlertsView renderiza sin error", async () => {
  const { AlertsView } = await import("../src/components/views/AlertsView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(AlertsView, { students, teachers, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

// view: AttendanceView
test("view: AttendanceView renderiza sin error", async () => {
  const { AttendanceView } = await import("../src/components/views/AttendanceView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(AttendanceView, { students, courses, teachers, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

// view: PredictionView
test("view: PredictionView renderiza sin error", async () => {
  const { PredictionView } = await import("../src/components/views/PredictionView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(PredictionView, { students, courses, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

// view: TeachersView
test("view: TeachersView renderiza sin error", async () => {
  const { TeachersView } = await import("../src/components/views/TeachersView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(TeachersView, {
      teachers,
      secciones,
      form: { nombres: "", apellidos: "", especialidad: "", correo: "", telefono: "", crearCuenta: false, password: "", confirmPassword: "" },
      setForm: () => {},
      onSubmit: async () => {},
      onUpdate: async () => {},
      onDeactivate: async () => {},
      onCreateAccount: async () => {},
      canEdit: true,
    })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

// view: ProfessorAlertsView
test("view: ProfessorAlertsView renderiza sin error", async () => {
  const { ProfessorAlertsView } = await import("../src/components/views/ProfessorAlertsView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(ProfessorAlertsView, { students, teachers, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

// view: ProfessorGradesView
test("view: ProfessorGradesView renderiza sin error", async () => {
  const { ProfessorGradesView } = await import("../src/components/views/ProfessorGradesView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(ProfessorGradesView, { students, courses, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

// view: LearningView
test("view: LearningView renderiza sin error", async () => {
  const { LearningView } = await import("../src/components/views/LearningView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(LearningView, { courses, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

// view: PredictionHistoryView
test("view: PredictionHistoryView renderiza sin error", async () => {
  const { PredictionHistoryView } = await import("../src/components/views/PredictionHistoryView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(PredictionHistoryView, { students, courses, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

// view: MlMetricsSection
test("view: MlMetricsSection renderiza sin error", async () => {
  const { MlMetricsSection } = await import("../src/components/views/MlMetricsSection.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(MlMetricsSection, {})),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});
