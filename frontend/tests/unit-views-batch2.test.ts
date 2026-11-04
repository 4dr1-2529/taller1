import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthContext } from "../src/contexts/AuthProvider.js";

const authValue = {
  user: { sub: "1", role: "docente", email: "p@b.com", nombres: "Prof", apellidos: "X" },
  token: null, loading: false, login: async () => {}, logout: async () => {}, refresh: async () => {},
  isAuthenticated: true, hasRole: () => true, isAdmin: false, isDocente: true, isEstudiante: false,
};

function withAuth(children: React.ReactNode) {
  return createElement(AuthContext.Provider, { value: authValue }, children);
}

const students = [{ id: "s1", nombres: "Ana", apellidos: "Garcia", seccionId: "s1", estado: "activa", dni: "12345678", promedioGeneral: 14, asistenciaGeneral: 90, hasGrades: true, hasAttendance: true, storedPrediction: { score: 70, level: "medio", probability: 0.7, factors: [], modelName: "m" }, prediction: { score: 70, level: "medio", probability: 0.7, factors: [], modelName: "m" }, metrics: { promedioGeneral: 14, asistenciaGeneral: 90, lms: { actividadSemanalPct: [50], minutosPorSemana: [120], horasPlataformaSemana: 5 } }, anioLectivoId: "1" } as any];
const courses = [{ id: "c1", nombre: "Matemática", seccionId: "s1" } as any];
const teachers = [{ id: "t1", nombres: "Prof", apellidos: "X", codigo: "T001" } as any];
const secciones = [{ id: "s1", gradoId: 1, gradoLabel: "1° A", nombre: "A" }];

test("view: ProfessorDashboard renderiza", async () => {
  const { ProfessorDashboard } = await import("../src/components/dashboard/ProfessorDashboard.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(ProfessorDashboard, { students, courses, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: ProfessorAttendanceView renderiza", async () => {
  const { ProfessorAttendanceView } = await import("../src/components/views/ProfessorAttendanceView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(ProfessorAttendanceView, { students, courses, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: ProfessorPredictionView renderiza", async () => {
  const { ProfessorPredictionView } = await import("../src/components/views/ProfessorPredictionView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(ProfessorPredictionView, { students, courses, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: AcademicStructureView renderiza", async () => {
  const { AcademicStructureView } = await import("../src/components/views/AcademicStructureView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(AcademicStructureView, { secciones, courses, teachers })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: CoursesView renderiza", async () => {
  const { CoursesView } = await import("../src/components/views/CoursesView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(CoursesView, { courses, teachers, secciones })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: EnrollmentsView renderiza", async () => {
  const { EnrollmentsView } = await import("../src/components/views/EnrollmentsView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(EnrollmentsView, {
      students,
      secciones,
      matriculaStats: null,
      form: { estudianteId: "", seccionId: "", anioLectivoId: "" },
      setForm: () => {},
      onAdd: async () => {},
      onRefresh: async () => {},
    })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: MensajeriaAcademicaView renderiza", async () => {
  const { MensajeriaAcademicaView } = await import("../src/components/views/MensajeriaAcademicaView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(MensajeriaAcademicaView, {})),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: AuditView renderiza", async () => {
  const { AuditView } = await import("../src/components/views/AuditView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(AuditView, {})),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: ReportsView renderiza", async () => {
  const { ReportsView } = await import("../src/components/views/ReportsView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(ReportsView, { students, courses })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: SettingsView renderiza", async () => {
  const { SettingsView } = await import("../src/components/views/SettingsView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(SettingsView, {})),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: ObservedProgressView renderiza", async () => {
  const { ObservedProgressView } = await import("../src/components/views/ObservedProgressView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(ObservedProgressView, { students, courses })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: StudentGradesView renderiza", async () => {
  const { StudentGradesView } = await import("../src/components/student/StudentGradesView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(StudentGradesView, { student: students[0] })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: StudentAttendanceView renderiza", async () => {
  const { StudentAttendanceView } = await import("../src/components/student/StudentAttendanceView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(StudentAttendanceView, { student: students[0] })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("view: StudentPredictionView renderiza", async () => {
  const { StudentPredictionView } = await import("../src/components/student/StudentPredictionView.js");
  const html = renderToStaticMarkup(
    withAuth(createElement(StudentPredictionView, { student: students[0] })),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});
