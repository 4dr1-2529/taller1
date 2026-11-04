import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../src/app/(shell)/page.js";
import LoginPage from "../src/app/(auth)/login/page.js";
import { PredictionView } from "../src/components/views/PredictionView.js";
import { AlertsView } from "../src/components/views/AlertsView.js";
import { MlMetricsSection } from "../src/components/views/MlMetricsSection.js";
import { StudentAlertsView } from "../src/components/student/StudentAlertsView.js";
import { StudentPredictionView } from "../src/components/student/StudentPredictionView.js";
import { StudentGradesView } from "../src/components/student/StudentGradesView.js";
import { StudentAttendanceView } from "../src/components/student/StudentAttendanceView.js";
import { TeachersView, defaultTeacherForm } from "../src/components/views/TeachersView.js";
import { GradesView } from "../src/components/views/GradesView.js";
import { AttendanceView } from "../src/components/views/AttendanceView.js";
import { ProfessorAlertsView } from "../src/components/views/ProfessorAlertsView.js";
import { ProfessorGradesView } from "../src/components/views/ProfessorGradesView.js";
import { ObservedProgressView } from "../src/components/views/ObservedProgressView.js";
import { AuditView } from "../src/components/views/AuditView.js";
import { ProfessorPredictionView } from "../src/components/views/ProfessorPredictionView.js";
import { SettingsView } from "../src/components/views/SettingsView.js";
import { LearningView } from "../src/components/views/LearningView.js";
import { MensajeriaAcademicaView } from "../src/components/views/MensajeriaAcademicaView.js";
import { NotificationBell } from "../src/components/NotificationBell.js";
import { ProfessorStudentsView } from "../src/components/views/ProfessorStudentsView.js";
import { ProfessorAttendanceView } from "../src/components/views/ProfessorAttendanceView.js";
import { StudentsView, defaultStudentForm } from "../src/components/views/StudentsView.js";
import { AcademicStructureView } from "../src/components/views/AcademicStructureView.js";
import { EnrollmentsView } from "../src/components/views/EnrollmentsView.js";
import { TeacherAssignmentsView } from "../src/components/views/TeacherAssignmentsView.js";
import { StudentDashboard } from "../src/components/student/StudentDashboard.js";
import { PredictionHistoryView } from "../src/components/views/PredictionHistoryView.js";
import { useAcademicStructure } from "../src/hooks/useAcademicStructure.js";
import { useProfessorStructure } from "../src/hooks/useProfessorStructure.js";
import { useAcademicData } from "../src/hooks/useAcademicData.js";
import { AuthContext, AuthProvider } from "../src/contexts/AuthProvider.js";
import { ThemeProvider, useTheme } from "../src/contexts/ThemeProvider.js";
import { BentoDashboard } from "../src/components/dashboard/bento/BentoDashboard.js";
import { api } from "../src/services/api.js";
import { FormField, FormGrid, FormInput, FormSelect, FormTextarea } from "../src/components/ui/FormField.js";
import { AppSidebar } from "../src/components/AppSidebar.js";
import { profesorService } from "../src/services/profesorService.js";
import { estudianteService } from "../src/services/estudianteService.js";

const roles = {
  admin: ["Dashboard", "Auditoría", "Configuración", "Grados y secciones", "Estudiantes", "Profesores", "Asignaciones", "Cursos", "Matrículas", "Notas", "Asistencia", "Actividad LMS", "Predicción", "Alertas", "Historial predicciones", "Mensajería Académica", "Reportes"],
  docente: ["Dashboard", "Estudiantes", "Profesores", "Asignaciones", "Cursos", "Notas", "Asistencia", "Actividad LMS", "Materiales", "Actividades", "Avisos", "Predicción", "Alertas", "Historial predicciones", "Mensajería Académica", "Reportes"],
  estudiante: ["Dashboard", "Cursos", "Notas", "Asistencia", "Actividad LMS", "Materiales", "Actividades", "Avisos", "Predicción", "Alertas", "Mensajería Académica"],
} as const;

function withHookHarness<T>(auth: object, activeSection: string | undefined, action: () => T, states: unknown[] = [], effects?: React.EffectCallback[], layoutEffects?: React.EffectCallback[]): T {
  const original = {
    useState: React.useState,
    useEffect: React.useEffect,
    useLayoutEffect: React.useLayoutEffect,
    useMemo: React.useMemo,
    useCallback: React.useCallback,
    useContext: React.useContext,
  };
  let stateIndex = 0;
  React.useState = ((initial: unknown) => {
    const index = stateIndex++;
    const value = index === 0 && activeSection !== undefined ? activeSection : (index in states ? states[index] : initial);
    return [value, () => undefined];
  }) as typeof React.useState;
  React.useEffect = ((effect: React.EffectCallback) => { effects?.push(effect); }) as typeof React.useEffect;
  React.useLayoutEffect = ((effect: React.EffectCallback) => { layoutEffects?.push(effect); }) as typeof React.useLayoutEffect;
  React.useMemo = ((factory: () => unknown) => factory()) as typeof React.useMemo;
  React.useCallback = ((callback: unknown) => callback) as typeof React.useCallback;
  React.useContext = ((context: React.Context<unknown>) => context === AuthContext ? auth : original.useContext(context)) as typeof React.useContext;
  try { return action(); }
  finally {
    React.useState = original.useState;
    React.useEffect = original.useEffect;
    React.useLayoutEffect = original.useLayoutEffect;
    React.useMemo = original.useMemo;
    React.useCallback = original.useCallback;
    React.useContext = original.useContext;
  }
}

function authFor(role: "admin" | "docente" | "estudiante") {
  return {
    user: { sub: "test-user", role, email: "prueba@example.test", nombres: "Ana", apellidos: "Prueba" },
    loading: false,
    isAuthenticated: true,
    isDocente: role === "docente",
    isEstudiante: role === "estudiante",
  };
}

function findElement(node: unknown, predicate: (element: React.ReactElement) => boolean): React.ReactElement | undefined {
  if (Array.isArray(node)) {
    for (const child of node) { const found = findElement(child, predicate); if (found) return found; }
    return undefined;
  }
  if (!React.isValidElement(node)) return undefined;
  if (predicate(node)) return node;
  return findElement((node as React.ReactElement<{ children?: React.ReactNode }>).props.children, predicate);
}

function collectElements(node: unknown, predicate: (element: React.ReactElement) => boolean, found: React.ReactElement[] = []): React.ReactElement[] {
  if (Array.isArray(node)) { for (const child of node) collectElements(child, predicate, found); return found; }
  if (!React.isValidElement(node)) return found;
  if (predicate(node)) found.push(node);
  collectElements((node as React.ReactElement<{ children?: React.ReactNode }>).props.children, predicate, found);
  return found;
}

test("main route selects each available page for director, teacher and student", () => {
  for (const role of ["admin", "docente", "estudiante"] as const) {
    for (const section of roles[role]) {
      const shell = withHookHarness(authFor(role), section, () => Home());
      assert.ok(React.isValidElement(shell));
      assert.ok((shell as React.ReactElement<{ children?: React.ReactNode }>).props.children, `${role}/${section} should select a page`);
    }
  }
});

test("login screen renders its full sign-in experience and authenticated loading states", () => {
  const signedOut = { user: null, token: null, loading: false, login: async () => {}, logout: () => {}, refresh: async () => {}, isAuthenticated: false, hasRole: () => false, isAdmin: false, isDocente: false, isEstudiante: false };
  const loginMarkup = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: signedOut }, React.createElement(ThemeProvider, null, React.createElement(LoginPage))));
  assert.match(loginMarkup, /Entender el presente/);
  assert.match(loginMarkup, /Seguimiento académico/);
  assert.match(loginMarkup, /login-email/);
  assert.match(loginMarkup, /login-password/);
  const authenticated = { ...signedOut, isAuthenticated: true };
  const redirectMarkup = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: authenticated }, React.createElement(ThemeProvider, null, React.createElement(LoginPage))));
  assert.match(redirectMarkup, /aria-label="Cargando"/);
});

test("login actions validate credentials, toggle password visibility and handle success or rejection", async () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const fakeWindow = { location: { href: "", replace: () => undefined } };
  Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });
  const attempts: string[][] = [];
  const validAuth = { ...authFor("admin"), isAuthenticated: false, login: async (email: string, password: string) => { attempts.push([email, password]); } };
  const state = [false, "bad-email", "short", false, false, {}];
  try {
    const invalidTree = withHookHarness(validAuth, undefined, () => LoginPage(), state);
    const invalidForm = findElement(invalidTree, el => el.type === "form");
    const visibility = findElement(invalidTree, el => (el.props as { "aria-label"?: string })["aria-label"] === "Mostrar contraseña");
    assert.ok(invalidForm && visibility);
    (visibility!.props as { onClick: () => void }).onClick();
    (invalidForm!.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(attempts.length, 0);

    const successState = [false, " ANA@EXAMPLE.TEST ", "ValidPass1!", false, true, {}];
    const successTree = withHookHarness(validAuth, undefined, () => LoginPage(), successState);
    const successForm = findElement(successTree, el => el.type === "form");
    (successForm!.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(attempts, [["ana@example.test", "ValidPass1!"]]);
    assert.equal(fakeWindow.location.href, "/");

    const rejectedAuth = { ...validAuth, login: async () => { throw new Error("Cuenta bloqueada"); } };
    const rejected = withHookHarness(rejectedAuth, undefined, () => LoginPage(), successState);
    const rejectedForm = findElement(rejected, el => el.type === "form");
    (rejectedForm!.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    await new Promise(resolve => setTimeout(resolve, 0));
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else delete (globalThis as { window?: Window }).window;
  }
});

test("prediction result renders legacy and current payload fields and every value formatter branch", () => {
  const prediction = {
    score: Number.NaN,
    level: "MEDIO",
    probabilityAbandono: 0.72,
    recommendation: "Acompañamiento semanal",
    factores_riesgo: [{ key: "asistencia", label: "Asistencia baja", contribution: 120 }],
    datos_ingresados: {
      modelVersion: "v6",
      promedio_general: 14.5,
      cursos_desaprobados: 2,
      boolean_flag: false,
      optional: null,
      complex: { value: 1 },
    },
    modelo_usado: "ensemble-v6",
    fecha_prediccion: "fecha-no-valida",
    dataMode: "real",
    datasetVersion: "2026.1",
  };
  const student = { id: "s1", codigo: "EST-01", nombres: "Ana", apellidos: "Sol" };
  const markup = withHookHarness(authFor("admin"), "s1", () => renderToStaticMarkup(React.createElement(PredictionView, { students: [student] })), [undefined, prediction, false, ""]);
  assert.match(markup, /Resultado de la estimación/);
  assert.match(markup, /Ana Sol/);
  assert.match(markup, /72\.0%/);
  assert.match(markup, /Acompañamiento semanal/);
  assert.match(markup, /Sí|No/);
  assert.match(markup, /fecha-no-valida/);
});

test("API alerts view renders summaries, filtered results, recommendations and pagination", () => {
  const alert = {
    id: "a1", level: "alto", status: "nueva", score: 84, probability: 0.84,
    titulo: "Riesgo académico", recommendation: "Contactar a la familia",
    factores_riesgo: [{ key: "attendance", label: "Asistencia", contribution: 45 }],
    createdAt: "2026-10-01T10:00:00.000Z", student: { id: "s1", nombres: "Ana", apellidos: "Sol", codigo: "S001" },
    curso: { id: "c1", nombre: "Matemática" }, profesor: "Eva Paz",
  };
  const filters = { search: "", gradoId: "", seccionId: "", courseId: "", profesorId: "", status: "", alertStatus: "", riskLevel: "", estado: "", bimestre: "", fecha: "", semana: "" };
  const states = [
    [alert], [{ salon: "2° A", count: 1 }], "all", false, null, 2, 41,
    filters,
  ];
  const markup = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(AlertsView, { students: [], teachers: [], secciones: [], useApi: true })), states);
  assert.match(markup, /Alertas \(filtro\)/);
  assert.match(markup, /Ver todas/);
  assert.match(markup, /Ana Sol/);
  assert.match(markup, /Contactar a la familia/);
  assert.match(markup, /Asistencia \(45 pts\)/);
  assert.match(markup, /Anterior/);
  assert.match(markup, /Siguiente/);
});

test("student alert view formats read-only alert details and supported status labels", () => {
  const data = { items: [
    { id: "a1", titulo: "Asistencia baja", fecha: "2026-10-20T12:30:00.000Z", nivelRiesgo: "Riesgo alto", estado: "En seguimiento", score: 74, probabilidad: 0.74, recomendacion: "Conversar con tutor" },
    { id: "a2", titulo: "Alerta sin score", fecha: "fecha-inválida", nivelRiesgo: "Bajo", estado: "Estado externo", score: null, probabilidad: null, recomendacion: null },
  ] };
  const markup = withHookHarness(authFor("estudiante"), undefined, () => renderToStaticMarkup(React.createElement(StudentAlertsView)), [data, false, null]);
  assert.match(markup, /Asistencia baja/);
  assert.match(markup, /74\.0%/);
  assert.match(markup, /Conversar con tutor/);
  assert.match(markup, /fecha-inválida/);
});

test("student prediction view renders prediction and alert results plus independent errors", () => {
  const prediction = { score: 67, nivel: "Riesgo medio", nivelRiesgo: "Medio", probabilidadAbandono: 0.67, fecha: "2026-10-20T12:30:00.000Z", modelo: "ensemble", modeloVersion: "6", factores: [{ key: "attendance", label: "Asistencia", contribution: 28 }], recomendacion: "Acompañar", dataMode: "real" };
  const alerts = { items: [{ id: "a1", titulo: "Seguimiento", fecha: "2026-10-19T12:00:00.000Z", nivelRiesgo: "Alto", estado: "Nueva", recomendacion: "Revisar asistencia" }] };
  const result = withHookHarness(authFor("estudiante"), undefined, () => renderToStaticMarkup(React.createElement(StudentPredictionView)), [{ prediction }, alerts, false, null, null]);
  assert.match(result, /67\.0%/);
  assert.match(result, /Detalles técnicos de la estimación/);
  assert.match(result, /Asistencia/);
  assert.match(result, /Revisar asistencia/);
  const errors = withHookHarness(authFor("estudiante"), undefined, () => renderToStaticMarkup(React.createElement(StudentPredictionView)), [null, null, false, "Predicción no disponible", "Alertas no disponibles"]);
  assert.match(errors, /Predicción no disponible/);
  assert.match(errors, /Alertas no disponibles/);
});

test("student grades and attendance views render populated academic records", () => {
  const grades = { profile: { codigo: "S001", nombres: "Ana", apellidos: "Sol", gradoLabel: null, salon: null, periodoAcademico: null }, filas: [
    { courseId: "c1", curso: "Matemática", profesor: "Eva Paz", bimestre1: 18, bimestre2: null, bimestre3: 12, bimestre4: null, promedioFinal: 15, estado: "Aprobado" },
    { courseId: "c2", curso: "Ciencias", profesor: null, bimestre1: null, bimestre2: null, bimestre3: null, bimestre4: null, promedioFinal: null, estado: "Desconocido" },
  ], resumen: { promedioGeneral: 15, cursosAprobados: 1, cursosEnRiesgo: 0, cursosDesaprobados: 1, totalCursos: 2 } };
  const gradesHtml = withHookHarness(authFor("estudiante"), undefined, () => renderToStaticMarkup(React.createElement(StudentGradesView)), [grades, false, null]);
  assert.match(gradesHtml, /Ana Sol/);
  assert.match(gradesHtml, /Matemática/);
  assert.match(gradesHtml, /Bimestre 4/);
  assert.match(gradesHtml, /Desconocido/);

  const summary = { asistencias: 16, tardanzas: 2, faltas: 1, justificadas: 1, porcentaje: null, total: 20 };
  const attendance = [{ id: "a1", fecha: "2026-10-20T12:30:00.000Z", curso: null, estado: "Tardanza", observacion: null, profesor: null }];
  const attendanceHtml = withHookHarness(authFor("estudiante"), undefined, () => renderToStaticMarkup(React.createElement(StudentAttendanceView)), [attendance, summary, false, null, "2026-10", "2", "tardanza", "2026-10-01", "2026-10-31"]);
  assert.match(attendanceHtml, /Tardanzas/);
  assert.match(attendanceHtml, /Tardanza/);
  assert.match(attendanceHtml, /% Asistencia/);
  assert.match(attendanceHtml, /Mi historial de asistencia/);
});

test("model metrics view renders model comparison, optional metrics, holdout and features", () => {
  const model = { accuracy: 0.9, precision: 0.88, recall: 0.86, f1_score: 0.87, balanced_accuracy: 0.89, roc_auc: 0.92, pr_auc: 0.81, brier: 0.12, threshold: 0.42, confusion_matrix: [[8, 1], [2, 9]] };
  const raw = { best_model: "random_forest", data_mode: "real", dataset_version: "2026.1", model_version: "v6", features: ["promedio_general", "asistencia_general"], holdout_results: { random_forest: model }, random_forest: model, baseline: { accuracy: 0.7, precision: 0.7, recall: 0.7, f1_score: 0.7, confusion_matrix: [[5, 3], [2, 6]] }, accuracy: 0.8 };
  const markup = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(MlMetricsSection)), [raw, false, false]);
  assert.match(markup, /Comparación de modelos/);
  assert.match(markup, /Evaluación final/);
  assert.match(markup, /Balanced acc\./);
  assert.match(markup, /promedio_general/);
  assert.match(markup, /Matriz de confusión/);
});

test("teacher management renders workload, edit form, account setup and fallback workload", () => {
  const teacher = { id: "t1", codigo: "DOC-01", nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "987654321", userId: null, courses: [{ id: "c1", codigo: "C1", nombre: "Ciencias", seccionId: "sec1" }] };
  const props = { teachers: [teacher], secciones: [{ id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · 2°" }], form: { ...defaultTeacherForm, crearCuenta: false }, setForm: () => undefined, onSubmit: async () => undefined, onUpdate: async () => undefined, onDeactivate: async () => undefined, onCreateAccount: async () => undefined };
  const workload = { tipoAsignacion: "Tutor", cursos: [{ id: "c1", nombre: "Ciencias" }], grados: ["2°"], secciones: ["A"], totalAlumnos: 20, cargaAcademica: 3, polidocencia: { cursosDistintos: 2, maxCursos: 4, salonesDistintos: 2, maxSalones: 5 } };
  const account = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(TeachersView, props)), ["", "t1", null, null, "ValidPass1!", false, {}, {}, { t1: workload }]);
  assert.match(account, /Polidocencia/);
  assert.match(account, /Crear acceso con este correo/);
  assert.match(account, /Ciencias/);
  const edited = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(TeachersView, props)), ["", "t1", "t1", { nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "987654321" }, "", false, {}, {}, {}]);
  assert.match(edited, /Guardar cambios/);
  const fallback = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(TeachersView, props)), ["", "t1", null, null, "", false, {}, {}, { t1: "error" }]);
  assert.match(fallback, /Primaria · 2° A/);
});

test("teacher management validates and runs create, edit, deactivate and account callbacks", async () => {
  const teacher = { id: "t1", codigo: "DOC-01", nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "987654321", userId: null, courses: [] };
  const calls = { create: 0, update: 0, deactivate: 0, account: 0 };
  const props = {
    teachers: [teacher], secciones: [],
    form: { dni: "12345678", nombres: "Ana", apellidos: "Sol", especialidad: "Ciencias", correo: "ana@example.test", telefono: "987654321", crearCuenta: true, password: "ValidPass1!" },
    setForm: () => undefined,
    onSubmit: async () => { calls.create++; },
    onUpdate: async () => { calls.update++; },
    onDeactivate: async () => { calls.deactivate++; },
    onCreateAccount: async () => { calls.account++; },
  };
  const edit = { nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "987654321" };
  const tree = withHookHarness(authFor("admin"), undefined, () => TeachersView(props), ["", "t1", "t1", edit, "ValidPass1!", false, {}, {}, {}]);
  const forms = collectElements(tree, el => el.type === "form");
  assert.equal(forms.length, 2);
  for (const form of forms) (form.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
  const buttons = collectElements(tree, el => el.type === "button");
  const deactivate = buttons.find(el => JSON.stringify(el.props.children).includes("Desactivar"));
  const createAccount = buttons.find(el => JSON.stringify(el.props.children).includes("Crear acceso con este correo"));
  assert.ok(deactivate && createAccount);
  (deactivate!.props as { onClick: () => void }).onClick();
  (createAccount!.props as { onClick: () => void }).onClick();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(calls, { create: 1, update: 1, deactivate: 1, account: 1 });
});

test("teacher registration, profile edits and access setup reject invalid fields", () => {
  const teacher = { id: "t1", codigo: "DOC-01", nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "987654321", userId: null, courses: [] };
  const props = { teachers: [teacher], secciones: [], form: { ...defaultTeacherForm }, setForm: () => undefined, onSubmit: () => assert.fail("invalid form submitted"), onUpdate: async () => undefined, onDeactivate: async () => undefined, onCreateAccount: () => assert.fail("weak password accepted") };
  const invalidEdit = { nombres: "", apellidos: "Paz", especialidad: "Ciencias", correo: "bad-email", telefono: "12" };
  const tree = withHookHarness(authFor("admin"), undefined, () => TeachersView(props), ["", "t1", "t1", invalidEdit, "weak", false, {}, {}, {}]);
  const forms = collectElements(tree, el => el.type === "form");
  assert.equal(forms.length, 2);
  for (const form of forms) (form.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
  const account = collectElements(tree, el => el.type === "button").find(el => String(el.props.children).includes("Crear acceso con este correo"));
  assert.ok(account);
  (account!.props as { onClick: () => void }).onClick();
});

test("teacher grades and attendance views render selected-salon summaries and records", () => {
  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · 2°" };
  const student = { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", dni: "12345678", nivel: "Primaria · 2° A", seccionId: "sec1", correo: "", telefono: "", estado: "activo", hasGrades: true, hasAttendance: true, metrics: { promedioGeneral: 15, asistenciaGeneral: 88, lms: { engagement: "medio", actividadSemanalPct: [], minutosPorSemana: [], actividadesRealizadas: 0, recursosConsultados: 0, horasPlataformaSemana: 0 } } };
  const course = { id: "c1", codigo: "C1", nombre: "Matemática", nivel: "Primaria", profesorId: "t1", seccionId: "sec1" };
  const teacher = { id: "t1", codigo: "T1", nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "987654321" };
  const filters = { gradoId: "2", seccionId: "sec1", courseId: "c1", profesorId: "", bimestre: "1", estado: "", search: "", fecha: "2026-10-20", semana: "", riskLevel: "", alertStatus: "" };
  const gradeRows = [{ id: "g1", studentId: "s1", courseId: "c1", bimestre: 1, nota: 18, student: { codigo: "S001", nombres: "Ana", apellidos: "Sol" }, course: { codigo: "C1", nombre: "Matemática" } }];
  const hadToken = api.hasToken;
  api.setToken("coverage-test-token");
  try {
    const grades = withHookHarness(authFor("docente"), undefined, () => renderToStaticMarkup(React.createElement(GradesView, { students: [student], courses: [course], teachers: [teacher], secciones: [section] })), [gradeRows, false, { studentId: "s1", nota: "18", observacion: "Buen avance" }, {}, filters]);
    assert.match(grades, /Promedio curso/);
    assert.match(grades, /Ana Sol/);
    assert.match(grades, /Matemática/);
    assert.match(grades, /Registrar nota/);
    const attendance = withHookHarness(authFor("docente"), undefined, () => renderToStaticMarkup(React.createElement(AttendanceView, { students: [student], courses: [course], teachers: [teacher], secciones: [section] })), [
      [{ id: "a1", studentId: "s1", fecha: "2026-10-20T08:00:00.000Z", presente: false, justificado: false, tardanza: true, observacion: "Llegó tarde", student: { codigo: "S001", nombres: "Ana", apellidos: "Sol" } }], false, false, 1, 1, { s1: "tardanza" }, filters, "",
    ]);
    assert.match(attendance, /Asistieron \(marca\)/);
    assert.match(attendance, /Ana Sol/);
    assert.match(attendance, /Falta|Tardanza/);
    assert.match(attendance, /Guardar asistencia/);
  } finally { api.setToken(hadToken ? "coverage-previous-token" : null); }
});

test("director grade forms reject invalid notes and professor attendance saves the selected group", async () => {
  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · Segundo" };
  const student = { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", dni: "12345678", nivel: "Primaria · 2° A", seccionId: "sec1", correo: "", telefono: "", estado: "activo", hasGrades: true, hasAttendance: true, metrics: { promedioGeneral: 15, asistenciaGeneral: 90, lms: { engagement: "medio", actividadSemanalPct: [], minutosPorSemana: [], actividadesRealizadas: 0, recursosConsultados: 0, horasPlataformaSemana: 0 } } };
  const course = { id: "c1", codigo: "C1", nombre: "Matemática", nivel: "Primaria", profesorId: "t1", seccionId: "sec1" };
  const filters = { gradoId: "2", seccionId: "sec1", courseId: "c1", profesorId: "", bimestre: "1", estado: "", search: "", fecha: "2026-10-20", semana: "", riskLevel: "", alertStatus: "" };
  const names = ["createGrade", "getProfesorGrades", "bulkAttendance", "getProfesorAttendance"];
  const saved = names.map(name => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  const hadToken = api.hasToken;
  api.setToken("coverage-test-token");
  let gradeWrites = 0, attendanceWrites = 0;
  (api as unknown as Record<string, unknown>).createGrade = async () => { gradeWrites++; return {}; };
  (api as unknown as Record<string, unknown>).getProfesorGrades = async () => ({ items: [] });
  (api as unknown as Record<string, unknown>).bulkAttendance = async () => { attendanceWrites++; return { upserted: 1 }; };
  (api as unknown as Record<string, unknown>).getProfesorAttendance = async () => ({ items: [], total: 0 });
  try {
    const grade = withHookHarness(authFor("docente"), undefined, () => GradesView({ students: [student], courses: [course], teachers: [], secciones: [section] }), [[], false, { studentId: "s1", nota: "21", observacion: "" }, {}, filters]);
    const form = findElement(grade, el => el.type === "form");
    assert.ok(form);
    const submit = form!.props as { onSubmit: (event: { preventDefault(): void }) => void };
    submit.onSubmit({ preventDefault() {} });
    assert.equal(gradeWrites, 0);

    const validGrade = withHookHarness(authFor("docente"), undefined, () => GradesView({ students: [student], courses: [course], teachers: [], secciones: [section] }), [[], false, { studentId: "s1", nota: "18", observacion: "Buen avance" }, {}, filters]);
    const validForm = findElement(validGrade, el => el.type === "form");
    (validForm!.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });

    const attendance = withHookHarness(authFor("docente"), undefined, () => AttendanceView({ students: [student], courses: [course], teachers: [], secciones: [section] }), [[], false, false, 1, 0, { s1: "tardanza" }, filters, ""]);
    const save = collectElements(attendance, el => el.type === "button").find(el => String(el.props.children).startsWith("Guardar asistencia"));
    assert.ok(save);
    (save!.props as { onClick: () => void }).onClick();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(gradeWrites, 1);
    assert.equal(attendanceWrites, 1);
  } finally {
    for (const entry of saved) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
    api.setToken(hadToken ? "coverage-previous-token" : null);
  }
});

test("professor grade and attendance screens run search, validation and save handlers", async () => {
  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · 2°" };
  const course = { id: "c1", codigo: "C1", nombre: "Matemática", nivel: "Primaria", profesorId: "t1", seccionId: "sec1" };
  const student = { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", dni: "12345678", nivel: "Primaria · 2° A", correo: "", telefono: "", estado: "activo", hasGrades: true, hasAttendance: true, metrics: { promedioGeneral: 15, asistenciaGeneral: 90, lms: { engagement: "medio", actividadSemanalPct: [], minutosPorSemana: [], actividadesRealizadas: 0, recursosConsultados: 0, horasPlataformaSemana: 0 } } };
  const filters = { gradoId: "2", seccionId: "sec1", courseId: "c1", profesorId: "", bimestre: "1", estado: "", search: "Ana", fecha: "2026-10-20", semana: "", riskLevel: "", alertStatus: "" };
  const record = { id: "a1", studentId: "s1", fecha: "2026-10-20T00:00:00.000Z", presente: false, justificado: false, tardanza: true };
  const names = ["getEstudiantes", "getNotas", "createNota", "getAsistencia", "bulkAsistencia"];
  const saved = names.map(name => ({ name, value: (profesorService as unknown as Record<string, unknown>)[name], own: Object.hasOwn(profesorService, name) }));
  const calls: string[] = [];
  (profesorService as unknown as Record<string, unknown>).getEstudiantes = async () => { calls.push("students"); return { items: [{ id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", estado: "activo", promedioGeneral: 15, asistenciaGeneral: 90, nivel: "Primaria · 2° A", indicators: {}, predictions: [] }] }; };
  (profesorService as unknown as Record<string, unknown>).getNotas = async () => { calls.push("grades"); return { items: [{ studentId: "s1", courseId: "c1", bimestre: 1, nota: 18 }] }; };
  (profesorService as unknown as Record<string, unknown>).createNota = async () => { calls.push("save-grade"); return {}; };
  (profesorService as unknown as Record<string, unknown>).getAsistencia = async () => { calls.push("attendance"); return { items: [record] }; };
  (profesorService as unknown as Record<string, unknown>).bulkAsistencia = async () => { calls.push("save-attendance"); return {}; };
  try {
    const gradeTree = withHookHarness(authFor("docente"), undefined, () => ProfessorGradesView({ courses: [course], secciones: [section] }), [filters, filters, true, [student], [{ studentId: "s1", courseId: "c1", bimestre: 1, nota: 18 }], false, null, null, { s1: "18" }]);
    const gradeSearch = findElement(gradeTree, el => typeof (el.props as { onSearch?: unknown }).onSearch === "function");
    const saveGrade = collectElements(gradeTree, el => el.type === "button").find(el => el.props.children === "Guardar");
    assert.ok(gradeSearch && saveGrade);
    (gradeSearch!.props as { onSearch: () => void }).onSearch();
    (saveGrade!.props as { onClick: () => void }).onClick();

    const invalidGrades = withHookHarness(authFor("docente"), undefined, () => ProfessorGradesView({ courses: [course], secciones: [section] }), [filters, filters, true, [student], [], false, null, null, { s1: "21" }]);
    const invalidSave = collectElements(invalidGrades, el => el.type === "button").find(el => el.props.children === "Guardar");
    (invalidSave!.props as { onClick: () => void }).onClick();

    const attendanceTree = withHookHarness(authFor("docente"), undefined, () => ProfessorAttendanceView({ courses: [course], secciones: [section] }), [filters, filters, true, [student], { s1: "tardanza" }, false, false, null]);
    const attendanceSearch = findElement(attendanceTree, el => typeof (el.props as { onSearch?: unknown }).onSearch === "function");
    const saveAttendance = collectElements(attendanceTree, el => el.type === "button").find(el => el.props.children === "Guardar asistencia masiva");
    assert.ok(attendanceSearch && saveAttendance);
    (attendanceSearch!.props as { onSearch: () => void }).onSearch();
    (saveAttendance!.props as { onClick: () => void }).onClick();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(calls.sort(), ["attendance", "attendance", "grades", "grades", "save-attendance", "save-grade", "students", "students", "students", "students"].sort());
  } finally {
    for (const entry of saved) {
      if (entry.own) (profesorService as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (profesorService as unknown as Record<string, unknown>)[entry.name];
    }
  }
});

test("professor alert and grade views render filtered records, traceability and current grades", () => {
  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · 2°" };
  const course = { id: "c1", codigo: "C1", nombre: "Matemática", nivel: "Primaria", profesorId: "t1", seccionId: "sec1" };
  const filters = { gradoId: "2", seccionId: "sec1", courseId: "c1", profesorId: "", bimestre: "1", estado: "", search: "", fecha: "2026-10-20", semana: "", riskLevel: "alto", alertStatus: "nueva" };
  const alert = { id: "a1", level: "alto", status: "nueva", score: 83, probability: 0.83, titulo: "Baja asistencia", createdAt: "2026-10-20T09:00:00.000Z", student: { id: "s1", nombres: "Ana", apellidos: "Sol", codigo: "S001", seccion: { nombre: "A", grado: { numero: 2 } } }, curso: { id: "c1", nombre: "Matemática" }, profesor: "Eva Paz", factores_riesgo: [{ key: "asistencia", label: "Asistencia", contribution: 32 }] };
  const alerts = withHookHarness(authFor("docente"), undefined, () => renderToStaticMarkup(React.createElement(ProfessorAlertsView, { courses: [course], secciones: [section] })), [filters, filters, true, [alert], [{ salon: "2°A", count: 1 }], "all", false, false, true, null]);
  assert.match(alerts, /Baja asistencia/);
  assert.match(alerts, /83\.0%/);
  assert.match(alerts, /Ver todas mis alertas/);
  assert.match(alerts, /Revisar|riesgo|asistencia/i);

  const student = { id: "s1", codigo: "S001", dni: "12345678", nombres: "Ana", apellidos: "Sol", nivel: "Primaria · 2° A", seccionId: "sec1", correo: "", telefono: "", estado: "activo", hasGrades: true, hasAttendance: true, metrics: { promedioGeneral: 15, asistenciaGeneral: 88, lms: { engagement: "medio", actividadSemanalPct: [], minutosPorSemana: [], actividadesRealizadas: 0, recursosConsultados: 0, horasPlataformaSemana: 0 } } };
  const professorGrades = withHookHarness(authFor("docente"), undefined, () => renderToStaticMarkup(React.createElement(ProfessorGradesView, { courses: [course], secciones: [section] })), [
    filters, filters, true, [student], [{ studentId: "s1", courseId: "c1", bimestre: 1, nota: 8 }], false, null, null, { s1: "17" },
  ]);
  assert.match(professorGrades, /Ana Sol/);
  assert.match(professorGrades, /Matemática/);
  assert.match(professorGrades, /Desaprobado/);
  assert.match(professorGrades, /Guardar/);
});

test("administrator and professor alert actions filter, resolve and reload alerts", async () => {
  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · Segundo" };
  const course = { id: "c1", codigo: "C1", nombre: "Matemática", nivel: "Primaria", profesorId: "t1", seccionId: "sec1" };
  const student = { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", nivel: "Primaria · 2° A", seccionId: "sec1", correo: "", telefono: "", estado: "activo", hasGrades: false, hasAttendance: false, metrics: { promedioGeneral: 0, asistenciaGeneral: 0, lms: { engagement: "bajo", actividadSemanalPct: [], minutosPorSemana: [], actividadesRealizadas: 0, recursosConsultados: 0, horasPlataformaSemana: 0 } } };
  const alert = { id: "a1", level: "alto", status: "nueva", score: 83, probability: 0.83, titulo: "Asistencia baja", createdAt: "2026-10-20T09:00:00.000Z", student: { id: "s1", nombres: "Ana", apellidos: "Sol", codigo: "S001", seccion: { nombre: "A", grado: { numero: 2 } } }, curso: { id: "c1", nombre: "Matemática" }, profesor: "Eva Paz", recommendation: "Revisar asistencia" };
  const filters = { gradoId: "2", seccionId: "sec1", courseId: "c1", profesorId: "", bimestre: "", estado: "", search: "Ana", fecha: "", semana: "", riskLevel: "alto", alertStatus: "nueva" };
  const savedApi = ["getAlerts", "updateAlertStatus"].map(name => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  const savedProfessor = ["getAlertas", "patchAlertaEstado"].map(name => ({ name, value: (profesorService as unknown as Record<string, unknown>)[name], own: Object.hasOwn(profesorService, name) }));
  let adminLoads = 0, profLoads = 0, statusWrites = 0;
  (api as unknown as Record<string, unknown>).getAlerts = async () => { adminLoads++; return { items: [alert], total: 1, salonSummary: [{ salon: "2° A", count: 1 }] }; };
  (api as unknown as Record<string, unknown>).updateAlertStatus = async () => { statusWrites++; return {}; };
  (profesorService as unknown as Record<string, unknown>).getAlertas = async () => { profLoads++; return { items: [alert], total: 1, salonSummary: [{ salon: "2°A", count: 1 }] }; };
  (profesorService as unknown as Record<string, unknown>).patchAlertaEstado = async () => { statusWrites++; return {}; };
  try {
    const admin = withHookHarness(authFor("admin"), undefined, () => AlertsView({ students: [student], secciones: [section], useApi: true }), [[alert], [{ salon: "2° A", count: 1 }], "all", false, null, 2, 1, filters, "Ana"]);
    const adminPanel = findElement(admin, el => (el.props as { title?: string }).title === "Listado de alertas");
    const includeResolved = findElement((adminPanel!.props as { action?: unknown }).action, el => el.type === "input" && (el.props as { type?: string }).type === "checkbox");
    (includeResolved!.props as { onChange: (event: { target: { checked: boolean } }) => void }).onChange({ target: { checked: true } });
    const adminResolve = collectElements(admin, el => el.type === "button").find(el => el.props.children === "Resuelta");
    assert.ok(adminResolve);
    (adminResolve!.props as { onClick: () => void }).onClick();

    const professor = withHookHarness(authFor("docente"), undefined, () => ProfessorAlertsView({ courses: [course], secciones: [section] }), [filters, filters, true, [alert], [{ salon: "2°A", count: 1 }], "all", false, false, true, null]);
    const professorSearch = findElement(professor, el => typeof (el.props as { onSearch?: unknown }).onSearch === "function");
    const allAlerts = collectElements(professor, el => el.type === "button").find(el => String(el.props.children).includes("Ver todas mis alertas"));
    const professorResolve = collectElements(professor, el => el.type === "button").find(el => el.props.children === "Resolver");
    assert.ok(professorSearch && allAlerts && professorResolve);
    (professorSearch!.props as { onSearch: () => void }).onSearch();
    (allAlerts!.props as { onClick: () => void }).onClick();
    (professorResolve!.props as { onClick: () => void }).onClick();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.ok(adminLoads >= 1 && profLoads >= 3);
    assert.equal(statusWrites, 2);
  } finally {
    for (const entry of savedApi) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
    for (const entry of savedProfessor) {
      if (entry.own) (profesorService as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (profesorService as unknown as Record<string, unknown>)[entry.name];
    }
  }
});

test("learning screens render teacher publishing forms and material/activity catalog states", () => {
  const courses = [{ id: "c1", nombre: "Matemática", codigo: "MAT-2" }];
  const items = {
    resources: [{ id: "r1", titulo: "Guía de estudio", descripcion: "Repaso del periodo", tipo: "pdf", url: "https://example.test/guia.pdf" }],
    activities: [{ id: "a1", titulo: "Práctica semanal", descripcion: "Resuelva los ejercicios", tipo: "practica", progress: [{ estado: "completada" }] }],
  };
  const initial = [courses, "c1", items, false, "", false, "Título de prueba", "Descripción de prueba", "https://example.test/guia.pdf", "pdf"];
  const materials = withHookHarness(authFor("docente"), undefined, () => renderToStaticMarkup(React.createElement(LearningView, { mode: "materials" })), initial);
  assert.match(materials, /Materiales educativos/);
  assert.match(materials, /Publicar/);
  assert.match(materials, /Guía de estudio/);
  assert.match(materials, /Consultar pdf/);
  const activities = withHookHarness(authFor("estudiante"), undefined, () => renderToStaticMarkup(React.createElement(LearningView, { mode: "activities" })), initial);
  assert.match(activities, /Actividades académicas/);
  assert.match(activities, /Práctica semanal/);
  assert.match(activities, /completada/);
});

test("learning screens publish course materials, open resources and update student progress", async () => {
  const originalCall = (api as unknown as Record<string, unknown>).call;
  (api as unknown as Record<string, unknown>).call = async (path: string, options?: RequestInit) => {
    if (options?.method === "POST" || options?.method === "PATCH") requests.push({ path, options });
    if (path === "/materials/r1") return { item: { id: "r1", titulo: "Guía", tipo: "pdf", url: "https://example.test/guia.pdf" } };
    return { resources: [], activities: [] };
  };
  const requests: { path: string; options?: RequestInit }[] = [];
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  let opened = "";
  Object.defineProperty(globalThis, "window", { configurable: true, value: { open: (url: string) => { opened = url; } } });
  try {
    const course = { id: "c1", codigo: "C1", nombre: "Matemática" };
    const resources = [{ id: "r1", titulo: "Guía", descripcion: "Ejercicios", tipo: "pdf", url: "https://example.test/guia.pdf" }];
    const teacher = withHookHarness(authFor("docente"), undefined, () => LearningView({ mode: "materials" }), [[course], "c1", { resources, activities: [] }, false, "", false, "Guía semanal", "Repaso del tema", "https://example.test/guia.pdf", "pdf"]);
    const form = findElement(teacher, el => el.type === "form");
    assert.ok(form);
    (form!.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    const open = collectElements(teacher, el => el.type === "button").find(el => String(el.props.children).includes("Consultar"));
    assert.ok(open);
    (open!.props as { onClick: () => void }).onClick();

    const student = withHookHarness(authFor("estudiante"), undefined, () => LearningView({ mode: "activities" }), [[course], "c1", { resources: [], activities: [{ id: "a1", titulo: "Práctica", descripcion: "Resolver ejercicios", tipo: "practica", progress: [{ estado: "pendiente" }] }] }, false, "", false, "", "", "", "practica"]);
    const start = collectElements(student, el => el.type === "button").find(el => el.props.children === "Iniciar actividad");
    assert.ok(start);
    (start!.props as { onClick: () => void }).onClick();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(opened, "https://example.test/guia.pdf");
    assert.ok(requests.some(request => request.path === "/materials" && request.options?.method === "POST"));
    assert.ok(requests.some(request => request.path === "/activities/a1/progress" && request.options?.method === "PATCH"));
  } finally {
    if (Object.hasOwn(api, "call")) (api as unknown as Record<string, unknown>).call = originalCall;
    else delete (api as unknown as Record<string, unknown>).call;
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else delete (globalThis as { window?: Window }).window;
  }
});

test("auth provider exposes role checks and exercises login, refresh and logout persistence", async () => {
  const stored = new Map<string, string>([["tesis-token", "old-token"], ["tesis-refresh-token", "old-refresh"]]);
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
    removeItem: (key: string) => { stored.delete(key); },
  } });
  const names = ["login", "refreshToken", "logout"] as const;
  const saved = names.map((name) => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  (api as unknown as Record<string, unknown>).login = async () => ({ token: "new-token", refreshToken: "new-refresh", user: { sub: "u1", role: "admin", email: "ana@example.test", nombres: "Ana", apellidos: "Sol" } });
  (api as unknown as Record<string, unknown>).refreshToken = async () => ({ token: "rotated-token", refreshToken: "rotated-refresh" });
  (api as unknown as Record<string, unknown>).logout = async () => undefined;
  try {
    const provider = withHookHarness(authFor("admin"), undefined, () => AuthProvider({ children: null }), [authFor("admin").user, "old-token", "old-refresh", false]) as React.ReactElement<{ value: { hasRole: (roles: string[]) => boolean; login: (email: string, password: string) => Promise<void>; logout: () => void; refresh: () => Promise<void> } }>;
    const value = provider.props.value;
    assert.equal(value.hasRole(["admin"]), true);
    assert.equal(value.hasRole(["docente"]), false);
    await value.login(" ANA@EXAMPLE.TEST ", "ValidPass1!");
    assert.equal(stored.get("tesis-token"), "new-token");
    assert.equal(stored.get("tesis-refresh-token"), "new-refresh");
    await value.refresh();
    assert.equal(stored.get("tesis-token"), "rotated-token");
    assert.equal(stored.get("tesis-refresh-token"), "rotated-refresh");
    value.logout();
    assert.equal(stored.has("tesis-token"), false);
    assert.equal(stored.has("tesis-user"), false);
  } finally {
    for (const entry of saved) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete (globalThis as { localStorage?: Storage }).localStorage;
    api.setToken(null);
  }
});

test("auth provider restores saved sessions, repairs expired sessions and clears corrupt storage", async () => {
  const stored = new Map<string, string>([
    ["tesis-token", "old-token"], ["tesis-refresh-token", "old-refresh"],
    ["tesis-user", JSON.stringify(authFor("admin").user)],
  ]);
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
    removeItem: (key: string) => { stored.delete(key); },
  } });
  const names = ["getMe", "refreshToken", "logout"];
  const saved = names.map(name => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  let meCalls = 0;
  (api as unknown as Record<string, unknown>).getMe = async () => {
    meCalls++;
    if (meCalls === 1) throw new Error("access expirado");
    return { user: authFor("admin").user };
  };
  (api as unknown as Record<string, unknown>).refreshToken = async () => ({ token: "restored-token", refreshToken: "restored-refresh" });
  (api as unknown as Record<string, unknown>).logout = async () => undefined;
  try {
    const effects: React.EffectCallback[] = [];
    withHookHarness(authFor("admin"), undefined, () => AuthProvider({ children: null }), [null, null, null, true], effects);
    effects[0]!();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(meCalls, 2);
    assert.equal(stored.get("tesis-token"), "restored-token");
    assert.equal(stored.get("tesis-user"), JSON.stringify(authFor("admin").user));

    stored.set("tesis-user", "{");
    const corruptEffects: React.EffectCallback[] = [];
    withHookHarness(authFor("admin"), undefined, () => AuthProvider({ children: null }), [null, null, null, true], corruptEffects);
    corruptEffects[0]!();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(stored.has("tesis-token"), false);
  } finally {
    for (const entry of saved) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete (globalThis as { localStorage?: Storage }).localStorage;
    api.setToken(null);
  }
});

test("auth refresh retries a token rotated by another tab and logs out if the retry fails", async () => {
  const stored = new Map<string, string>([["tesis-token", "access"], ["tesis-refresh-token", "rotated-in-another-tab"]]);
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
    removeItem: (key: string) => { stored.delete(key); },
  } });
  const names = ["refreshToken", "logout"];
  const saved = names.map(name => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  let refreshCalls = 0;
  (api as unknown as Record<string, unknown>).refreshToken = async (token: string) => {
    refreshCalls++;
    if (token === "stale-refresh") throw new Error("rotated elsewhere");
    if (refreshCalls > 2) throw new Error("invalid refresh");
    return { token: "renewed-access", refreshToken: "renewed-refresh" };
  };
  (api as unknown as Record<string, unknown>).logout = async () => undefined;
  try {
    const provider = withHookHarness(authFor("admin"), undefined, () => AuthProvider({ children: null }), [authFor("admin").user, "access", "stale-refresh", false]) as React.ReactElement<{ value: { refresh: () => Promise<void> } }>;
    await provider.props.value.refresh();
    assert.equal(refreshCalls, 2);
    assert.equal(stored.get("tesis-refresh-token"), "renewed-refresh");

    stored.set("tesis-refresh-token", "rotated-again");
    (api as unknown as Record<string, unknown>).refreshToken = async () => { throw new Error("session revoked"); };
    const failing = withHookHarness(authFor("admin"), undefined, () => AuthProvider({ children: null }), [authFor("admin").user, "access", "expired-refresh", false]) as React.ReactElement<{ value: { refresh: () => Promise<void> } }>;
    await failing.props.value.refresh();
    assert.equal(stored.has("tesis-token"), false);
  } finally {
    for (const entry of saved) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete (globalThis as { localStorage?: Storage }).localStorage;
    api.setToken(null);
  }
});

test("theme provider hydrates system preference and persists explicit theme changes", () => {
  const stored = new Map<string, string>();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const classes: { dark?: boolean } = {};
  const documentMock = { documentElement: { classList: { toggle: (name: string, enabled: boolean) => { classes[name] = enabled; } }, style: { colorScheme: "" }, cookie: "" } };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value) } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: () => ({ matches: true }) } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: documentMock });
  try {
    const layoutEffects: React.EffectCallback[] = [];
    const provider = withHookHarness(authFor("admin"), undefined, () => ThemeProvider({ children: null }), ["light"], [], layoutEffects) as React.ReactElement<{ value: { theme: string; setTheme: (theme: "light" | "dark") => void } }>;
    layoutEffects[0]!();
    assert.equal(documentMock.documentElement.style.colorScheme, "dark");
    assert.equal(classes.dark, true);
    assert.equal(stored.get("tesis-theme"), "dark");
    provider.props.value.setTheme("light");
    assert.equal(documentMock.documentElement.style.colorScheme, "light");
    assert.equal(classes.dark, false);
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage); else delete (globalThis as { localStorage?: Storage }).localStorage;
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else delete (globalThis as { window?: Window }).window;
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument); else delete (globalThis as { document?: Document }).document;
  }
});

test("notification bell renders unread counts, read items and the empty state", () => {
  const items = [
    { id: "n1", titulo: "Nueva alerta", mensaje: "Revisar el caso", leida: false, createdAt: "2026-10-20T10:00:00.000Z" },
    { id: "n2", titulo: "Aviso leído", mensaje: "Periodo actualizado", leida: true, createdAt: "2026-10-19T10:00:00.000Z" },
  ];
  const populated = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(NotificationBell)), [false, true, items]);
  assert.match(populated, /Notificaciones/);
  assert.match(populated, /Nueva alerta/);
  assert.match(populated, /Aviso leído/);
  assert.match(populated, /Marcar como leída/);
  const empty = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(NotificationBell)), [false, true, []]);
  assert.match(empty, /Sin notificaciones/);
  const signedOut = withHookHarness({ ...authFor("admin"), isAuthenticated: false }, undefined, () => renderToStaticMarkup(React.createElement(NotificationBell)));
  assert.equal(signedOut, "");
});

test("settings restricts alert thresholds to admins and validates password changes", async () => {
  const originalCall = (api as unknown as Record<string, unknown>).call;
  const calls: { path: string; options?: RequestInit }[] = [];
  (api as unknown as Record<string, unknown>).call = async (path: string, options?: RequestInit) => { calls.push({ path, options }); return { nivelMinimoAlerta: "alto" }; };
  try {
    const effects: React.EffectCallback[] = [];
    const admin = withHookHarness(authFor("admin"), undefined, () => SettingsView(), ["medio", "", "", "", false], effects);
    effects[0]!();
    const forms = collectElements(admin, el => el.type === "form");
    assert.equal(forms.length, 2);
    (forms[0].props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    (forms[1].props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });

    const validPassword = withHookHarness(authFor("admin"), undefined, () => SettingsView(), ["alto", "OldPass1!", "NewPass2!", "", false]);
    const passwordForm = collectElements(validPassword, el => el.type === "form")[1];
    (passwordForm.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    await new Promise(resolve => setTimeout(resolve, 0));
    const teacher = withHookHarness(authFor("docente"), undefined, () => SettingsView(), ["medio", "", "", "", false]);
    assert.equal(collectElements(teacher, el => el.type === "form").length, 1);
    assert.ok(calls.some(call => call.path === "/admin/settings" && call.options?.method === "PUT"));
    assert.ok(calls.some(call => call.path === "/auth/change-password" && call.options?.method === "POST"));
  } finally {
    if (Object.hasOwn(api, "call")) (api as unknown as Record<string, unknown>).call = originalCall;
    else delete (api as unknown as Record<string, unknown>).call;
  }
});

test("form primitives render hints, errors, custom classes and control attributes", () => {
  const markup = renderToStaticMarkup(React.createElement(FormGrid, { className: "coverage-grid" },
    React.createElement(FormField, { label: "Básico", hint: "Ayuda visible" }, React.createElement("input", { id: "basic" })),
    React.createElement(FormInput, { label: "Correo", type: "email", value: "bad", error: "Correo inválido", onChange: () => undefined }),
    React.createElement(FormSelect, { label: "Nivel", hint: "Seleccione", value: "alto", onChange: () => undefined }, React.createElement("option", { value: "alto" }, "Alto")),
    React.createElement(FormTextarea, { label: "Detalle", error: "Campo requerido", value: "", onChange: () => undefined, className: "custom-field" }),
  ));
  assert.match(markup, /coverage-grid/);
  assert.match(markup, /Ayuda visible/);
  assert.match(markup, /Correo inválido/);
  assert.match(markup, /custom-field/);
  assert.match(markup, /Nivel/);
});

test("sidebar renders the authenticated profile, role, logout control and navigation labels", () => {
  const auth = { ...authFor("admin"), user: { ...authFor("admin").user, id: "u1" }, token: "token", login: async () => undefined, logout: () => undefined, refresh: async () => undefined, hasRole: () => true, isAdmin: true };
  const markup = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: auth as never }, React.createElement(AppSidebar, { sections: ["Dashboard", "Alertas", "Estudiantes"], activeSection: "Dashboard", alertCount: 1, onSelect: () => undefined })));
  assert.match(markup, /Ana Prueba/);
  assert.match(markup, /Director/);
  assert.match(markup, /Cerrar sesión/);
  assert.match(markup, /1 alerta activa/);
});

test("academic messaging renders direct conversation, announcements and global publishing", () => {
  const rooms = [
    { roomId: "direct:u2", scope: "directo", label: "Eva Paz" },
    { roomId: "global:institucional", scope: "global", label: "Institución" },
    { roomId: "course:c1", scope: "curso", label: "Matemática" },
  ];
  const messages = [
    { id: "m1", contenido: "Hola Ana", fecha: "2026-10-20T10:00:00.000Z", remitente: { id: "u2", nombre: "Eva Paz", rol: "docente" }, leida: false },
    { id: "m2", contenido: "Gracias", createdAt: "2026-10-20T11:00:00.000Z", remitente: { id: "u1", nombre: "Ana Sol", rol: "admin" }, leida: true },
  ];
  const direct = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(MensajeriaAcademicaView, { mode: "messages" })), [rooms, "direct:u2", messages, "", false, ""]);
  assert.match(direct, /Mensajes/);
  assert.match(direct, /Hola Ana/);
  assert.match(direct, /No leído/);
  assert.match(direct, /Escribir mensaje/);
  const announcement = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(MensajeriaAcademicaView, { mode: "announcements" })), [rooms, "global:institucional", messages, "", false, "Comunicado de prueba"]);
  assert.match(announcement, /Comunicado global/);
  assert.match(announcement, /Publicar comunicado/);
  assert.match(announcement, /Avisos/);
});

test("academic messaging sends scoped replies and admin announcements with safe guards", async () => {
  const originalCall = (api as unknown as Record<string, unknown>).call;
  const calls: { path: string; options?: RequestInit }[] = [];
  (api as unknown as Record<string, unknown>).call = async (path: string, options?: RequestInit) => { calls.push({ path, options }); return path.includes("/rooms") ? { rooms: [] } : { items: [] }; };
  try {
    const directAuth = { ...authFor("estudiante"), user: { ...authFor("estudiante").user, id: "u1" } };
    const direct = withHookHarness(directAuth, undefined, () => MensajeriaAcademicaView({ useApi: false }), [[{ roomId: "direct:u2", scope: "directo", label: "Eva Paz" }], "direct:u2", [], "  Hola profesora  ", false, ""]);
    const sendButton = findElement(direct, el => (el.props as { "aria-label"?: string })["aria-label"] === "Enviar");
    assert.ok(sendButton);
    (sendButton!.props as { onClick: () => void }).onClick();

    const admin = withHookHarness(authFor("admin"), undefined, () => MensajeriaAcademicaView({ useApi: false, mode: "announcements" }), [[{ roomId: "global:institucional", scope: "global", label: "Institución" }], "global:institucional", [], "", false, "  Reunión el viernes  "]);
    const publish = collectElements(admin, el => el.type === "button").find(el => String(el.props.children).includes("Publicar comunicado"));
    assert.ok(publish);
    (publish!.props as { onClick: () => void }).onClick();
    await new Promise(resolve => setTimeout(resolve, 0));
    const message = calls.find(call => call.path === "/messages");
    assert.ok(message);
    const payload = JSON.parse(String(message!.options?.body));
    assert.equal(payload.contenido, "Hola profesora");
    assert.equal(payload.recipientUserId, "u2");
    assert.ok(calls.some(call => call.path === "/announcements" && call.options?.method === "POST"));
  } finally {
    if (Object.hasOwn(api, "call")) (api as unknown as Record<string, unknown>).call = originalCall;
    else delete (api as unknown as Record<string, unknown>).call;
  }
});

test("professor student and attendance searches query the selected academic scope", async () => {
  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · 2°" };
  const course = { id: "c1", codigo: "C1", nombre: "Matemática", nivel: "Primaria", profesorId: "t1", seccionId: "sec1" };
  const filters = { gradoId: "2", seccionId: "sec1", courseId: "c1", profesorId: "", bimestre: "1", estado: "", search: "Ana", fecha: "2026-10-20", semana: "", riskLevel: "", alertStatus: "" };
  const row = { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", dni: "12345678", correo: null, telefono: null, estado: "activo", promedioGeneral: 15, asistenciaGeneral: 90, nivel: "Primaria · 2° A", seccion: null, indicators: { promedio_general: 15, asistencia_general: 90 }, predictions: [], enrolledCourseIds: [] };
  const saved = new Map<string, { value: unknown; own: boolean }>();
  const replace = (name: string, value: unknown) => { saved.set(name, { value: (profesorService as unknown as Record<string, unknown>)[name], own: Object.hasOwn(profesorService, name) }); (profesorService as unknown as Record<string, unknown>)[name] = value; };
  const calls: unknown[] = [];
  replace("getEstudiantes", async (args: unknown) => { calls.push(["students", args]); return { items: [row] }; });
  replace("getAsistencia", async (args: unknown) => { calls.push(["attendance", args]); return { items: [{ id: "a1", studentId: "s1", fecha: "2026-10-20T00:00:00.000Z", presente: true, justificado: false, tardanza: false }] }; });
  try {
    const studentsTree = withHookHarness(authFor("docente"), undefined, () => ProfessorStudentsView({ courses: [course], secciones: [section] }), [filters, filters, false, [], false]);
    const studentsFilters = findElement(studentsTree, el => typeof (el.props as { onSearch?: unknown }).onSearch === "function");
    assert.ok(studentsFilters);
    (studentsFilters!.props as { onSearch: () => void }).onSearch();

    const attendanceTree = withHookHarness(authFor("docente"), undefined, () => ProfessorAttendanceView({ courses: [course], secciones: [section] }), [filters, filters, false, [], {}, false, false, null]);
    const attendanceFilters = findElement(attendanceTree, el => typeof (el.props as { onSearch?: unknown }).onSearch === "function");
    assert.ok(attendanceFilters);
    (attendanceFilters!.props as { onSearch: () => void }).onSearch();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(calls.length, 3);
    assert.deepEqual((calls[0] as unknown[])[0], "students");
    assert.deepEqual((calls[1] as unknown[])[0], "students");
    assert.deepEqual((calls[2] as unknown[])[0], "attendance");
  } finally {
    for (const [name, previous] of saved) {
      if (previous.own) (profesorService as unknown as Record<string, unknown>)[name] = previous.value;
      else delete (profesorService as unknown as Record<string, unknown>)[name];
    }
  }
});

test("academic structure covers signed-out, loading, error and populated hierarchy states", () => {
  const levels = [{ id: "n1", codigo: "primaria", nombre: "Primaria", grados: [{ id: "g1", numero: 2, nombre: "Segundo", secciones: [{ id: "s1", nombre: "A" }, { id: "s2", nombre: "B" }] }] }];
  const signedOut = withHookHarness({ ...authFor("admin"), isAuthenticated: false }, undefined, () => renderToStaticMarkup(React.createElement(AcademicStructureView)));
  assert.match(signedOut, /Iniciar sesión/);
  const loading = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(AcademicStructureView)), [[], true, null, 0]);
  assert.match(loading, /skeleton/);
  const error = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(AcademicStructureView)), [[], false, "No se pudo consultar la estructura", 0]);
  assert.match(error, /Volver a intentar/);
  const loaded = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(AcademicStructureView)), [levels, false, null, 0]);
  assert.match(loaded, /Niveles, grados y secciones/);
  assert.match(loaded, /Segundo/);
  assert.match(loaded, /Sección A/);
});

test("student registration invokes validation and forwards a valid enrollment form", async () => {
  const student = { id: "s1", codigo: "S001", dni: "12345678", nombres: "Ana", apellidos: "Sol", nivel: "Primaria · 2° A", correo: "", telefono: "", estado: "activo", hasGrades: false, hasAttendance: false, metrics: { promedioGeneral: 0, asistenciaGeneral: 0, lms: { engagement: "bajo", actividadSemanalPct: [], minutosPorSemana: [], actividadesRealizadas: 0, recursosConsultados: 0, horasPlataformaSemana: 0 } } };
  let submitted = 0;
  const props = { students: [student], secciones: [{ id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · 2°" }], newStudent: { ...defaultStudentForm }, setNewStudent: () => undefined, onAddStudent: async () => { submitted++; return true; }, onRefresh: () => undefined };
  const invalid = withHookHarness(authFor("admin"), undefined, () => StudentsView(props), ["", {}, 1, 1, null, 0, null, {}, {}, null]);
  const invalidForm = findElement(invalid, el => el.type === "form");
  assert.ok(invalidForm);
  (invalidForm!.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
  assert.equal(submitted, 0);

  const validProps = { ...props, newStudent: { nombres: "Ana", apellidos: "Sol", seccionId: "sec1", dni: "12345678", correo: "", telefono: "" } };
  const valid = withHookHarness(authFor("admin"), undefined, () => StudentsView(validProps), ["", {}, 1, 1, null, 0, null, {}, {}, null]);
  const validForm = findElement(valid, el => el.type === "form");
  assert.ok(validForm);
  (validForm!.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(submitted, 1);

  const savedMethods = ["updateStudent", "call"].map(name => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  let updates = 0;
  let deletes = 0;
  (api as unknown as Record<string, unknown>).updateStudent = async () => { updates++; return {}; };
  (api as unknown as Record<string, unknown>).call = async () => { deletes++; return {}; };
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { confirm: () => true } });
  try {
    const editForm = { nombres: "Ana", apellidos: "Sol", dni: "12345678", correo: "ana@example.test", telefono: "987654321" };
    const editingTree = withHookHarness(authFor("admin"), undefined, () => StudentsView(props), ["", {}, 1, 1, null, 0, student, editForm, {}, null]);
    const forms = collectElements(editingTree, el => el.type === "form");
    assert.equal(forms.length, 2);
    (forms[1].props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    const deactivateButton = findElement(editingTree, el => (el.props as { children?: unknown }).children === "Desactivar");
    assert.ok(deactivateButton);
    (deactivateButton!.props as { onClick: () => void }).onClick();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(updates, 1);
    assert.equal(deletes, 1);
  } finally {
    for (const entry of savedMethods) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else delete (globalThis as { window?: Window }).window;
  }
});

test("student edit and deactivation reject invalid data, cancellation and server errors", async () => {
  const student = { id: "s1", codigo: "S001", dni: "12345678", nombres: "Ana", apellidos: "Sol", nivel: "Primaria · 2° A", correo: "", telefono: "", estado: "activo", hasGrades: false, hasAttendance: false, metrics: { promedioGeneral: 0, asistenciaGeneral: 0, lms: { engagement: "bajo", actividadSemanalPct: [], minutosPorSemana: [], actividadesRealizadas: 0, recursosConsultados: 0, horasPlataformaSemana: 0 } } };
  const props = { students: [student], secciones: [], newStudent: { ...defaultStudentForm }, setNewStudent: () => undefined, onAddStudent: () => undefined };
  const saved = ["updateStudent", "call"].map(name => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  (api as unknown as Record<string, unknown>).updateStudent = async () => { throw new Error("actualización rechazada"); };
  (api as unknown as Record<string, unknown>).call = async () => { throw new Error("desactivación rechazada"); };
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  let confirmations = 0;
  Object.defineProperty(globalThis, "window", { configurable: true, value: { confirm: () => ++confirmations > 1 } });
  try {
    const editForm = { nombres: "Ana", apellidos: "Sol", dni: "12345678", correo: "ana@example.test", telefono: "987654321" };
    const tree = withHookHarness(authFor("admin"), undefined, () => StudentsView(props), ["", {}, 1, 1, null, 0, student, editForm, {}, null]);
    const forms = collectElements(tree, el => el.type === "form");
    (forms[1].props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    const deactivate = collectElements(tree, el => el.type === "button").find(el => el.props.children === "Desactivar");
    assert.ok(deactivate);
    (deactivate!.props as { onClick: () => void }).onClick();
    (deactivate!.props as { onClick: () => void }).onClick();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(confirmations, 2);
  } finally {
    for (const entry of saved) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else delete (globalThis as { window?: Window }).window;
  }
});

test("student and professor services encode endpoint filters and preserve request bodies", async () => {
  const originalCall = (api as unknown as Record<string, unknown>).call;
  const requests: { path: string; options?: RequestInit }[] = [];
  (api as unknown as Record<string, unknown>).call = async (path: string, options?: RequestInit) => { requests.push({ path, options }); return { items: [], rooms: [] }; };
  try {
    await Promise.all([
      estudianteService.getPerfil(), estudianteService.getDashboard(), estudianteService.getNotas(),
      estudianteService.getAsistencia(), estudianteService.getAsistencia({ mes: "2026-10", bimestre: "2", estado: "tardanza", desde: "2026-10-01", hasta: "2026-10-31" }),
      estudianteService.getLms(), estudianteService.getPrediccion(), estudianteService.getAlertas(), estudianteService.getMensajes(),
      profesorService.getDashboard(), profesorService.getGrados(), profesorService.getSecciones(), profesorService.getSecciones("g 2"),
      profesorService.getCursos(), profesorService.getCursos({ gradoId: "2", seccionId: "sec 1", cursoId: "c1", search: "Ana Sol", bimestre: "2", periodoNumero: 2, fecha: "2026-10-20", riskLevel: "alto", status: "nueva", page: 3, limit: 20, all: true }),
      profesorService.getEstudiantes({ gradoId: "2", seccionId: "sec1", search: "Ana", page: 2, limit: 800 }),
      profesorService.getNotas({ cursoId: "c1", periodoNumero: 2 }), profesorService.createNota({ studentId: "s1", nota: 18 }),
      profesorService.getAsistencia({ gradoId: "2", fecha: "2026-10-20" }), profesorService.bulkAsistencia({ fecha: "2026-10-20", records: [] }),
      profesorService.getLms({ seccionId: "sec1" }), profesorService.getHistorialPredicciones({ riskLevel: "alto" }),
      profesorService.predict("s1", { asistencia: 90 }), profesorService.getAlertas({ status: "nueva" }), profesorService.patchAlertaEstado("a1", "resuelta"),
    ]);
    assert.ok(requests.some(r => r.path === "/estudiante/asistencia?mes=2026-10&bimestre=2&estado=tardanza&desde=2026-10-01&hasta=2026-10-31"));
    assert.ok(requests.some(r => r.path.startsWith("/profesor/notas?") && r.path.includes("periodoNumero=2") && r.path.includes("courseId=c1")));
    assert.ok(requests.some(r => r.path.includes("gradoId=2&seccionId=sec+1")));
    assert.ok(requests.some(r => r.path === "/profesor/predicciones" && r.options?.method === "POST"));
    assert.ok(requests.some(r => r.path === "/profesor/alertas/a1/estado" && r.options?.method === "PATCH"));
  } finally {
    if (Object.hasOwn(api, "call")) (api as unknown as Record<string, unknown>).call = originalCall;
    else delete (api as unknown as Record<string, unknown>).call;
  }
});

test("enrollments view renders active records, filtering summaries and pending transition dialog", () => {
  const student = { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", dni: "12345678", nivel: "Primaria · 2° A", seccionId: "sec1", correo: "", telefono: "", estado: "activo", hasGrades: false, hasAttendance: false, metrics: { promedioGeneral: 0, asistenciaGeneral: 0, lms: { engagement: "bajo", actividadSemanalPct: [], minutosPorSemana: [], actividadesRealizadas: 0, recursosConsultados: 0, horasPlataformaSemana: 0 } } };
  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · Segundo" };
  const row = { id: "m1", codigo: "MAT-001", estado: "activa", fechaMatricula: "2026-03-01T00:00:00.000Z", estudianteId: "s1", seccionId: "sec1", anioLectivoId: "y1", estudiante: { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", seccionId: "sec1" }, seccion: { nombre: "A", gradoNumero: 2, gradoNombre: "Segundo", nivel: "Primaria", label: "Primaria · Segundo A" }, anioLectivo: { id: "y1", anio: 2026, nombre: "Año lectivo 2026" } };
  const filters = { gradoId: "2", seccionId: "sec1", courseId: "", profesorId: "", bimestre: "", estado: "", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const props = { students: [student], secciones: [section], matriculaStats: { matriculasActivas: 1, matriculasAnioLectivo: 1, estudiantesActivos: 1, anioLectivo: "2026", matriculadosIds: ["s1"] }, form: { estudianteId: "", seccionId: "sec1", anioLectivoId: "y1" }, setForm: () => undefined, onAdd: async () => undefined, onRefresh: async () => undefined };
  const markup = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(EnrollmentsView, props)), [[row], [{ id: "y1", anio: 2026, nombre: "Año lectivo 2026", activo: true }], false, {}, "", "activa", 1, 1, null, { m: row, next: "retirada" }, filters, ""]);
  assert.match(markup, /Matrículas activas/);
  assert.match(markup, /Nueva matrícula/);
  assert.match(markup, /Año lectivo 2026/);
  assert.match(markup, /Ana Sol/);
  assert.match(markup, /retirar|Retirar/i);
});

test("enrollment form validates submissions and confirms state changes through the API", async () => {
  const student = { id: "s2", codigo: "S002", nombres: "Luis", apellidos: "Rojas", dni: "87654321", nivel: "Primaria · 2° A", seccionId: "sec1", correo: "", telefono: "", estado: "activo", hasGrades: false, hasAttendance: false, metrics: { promedioGeneral: 0, asistenciaGeneral: 0, lms: { engagement: "bajo", actividadSemanalPct: [], minutosPorSemana: [], actividadesRealizadas: 0, recursosConsultados: 0, horasPlataformaSemana: 0 } } };
  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · Segundo" };
  const row = { id: "m1", codigo: "MAT-001", estado: "activa", fechaMatricula: "2026-03-01T00:00:00.000Z", estudianteId: "s1", seccionId: "sec1", anioLectivoId: "y1", estudiante: { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", seccionId: "sec1" }, seccion: { nombre: "A", gradoNumero: 2, gradoNombre: "Segundo", nivel: "Primaria", label: "Primaria · Segundo A" }, anioLectivo: { id: "y1", anio: 2026, nombre: "Año lectivo 2026" } };
  const filters = { gradoId: "", seccionId: "", courseId: "", profesorId: "", bimestre: "", estado: "", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const names = ["updateMatriculaState", "getMatriculas", "getAniosLectivos"];
  const saved = names.map(name => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  api.setToken("coverage-test-token");
  let transitions = 0, additions = 0, refreshes = 0;
  (api as unknown as Record<string, unknown>).updateMatriculaState = async () => { transitions++; return {}; };
  (api as unknown as Record<string, unknown>).getMatriculas = async () => ({ items: [row], total: 1 });
  (api as unknown as Record<string, unknown>).getAniosLectivos = async () => ({ items: [{ id: "y1", anio: 2026, nombre: "Año lectivo 2026", activo: true }] });
  const props = { students: [student], secciones: [section], matriculaStats: { matriculasActivas: 1, matriculasAnioLectivo: 1, estudiantesActivos: 2, anioLectivo: "2026", matriculadosIds: ["s1"] }, form: { estudianteId: "s2", seccionId: "sec1", anioLectivoId: "y1" }, setForm: () => undefined, onAdd: async () => { additions++; }, onRefresh: async () => { refreshes++; } };
  try {
    const tree = withHookHarness(authFor("admin"), undefined, () => EnrollmentsView(props), [[row], [{ id: "y1", anio: 2026, nombre: "Año lectivo 2026", activo: true }], false, {}, "", "activa", 1, 1, null, { m: row, next: "trasladada" }, filters, filters, ""]);
    const forms = collectElements(tree, el => el.type === "form");
    assert.ok(forms.length > 0);
    (forms[0].props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    const dialog = findElement(tree, el => typeof (el.props as { onConfirm?: unknown }).onConfirm === "function");
    assert.ok(dialog);
    (dialog!.props as { onConfirm: () => void }).onConfirm();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(additions, 1);
    assert.equal(transitions, 1);
    assert.equal(refreshes, 1);
  } finally {
    for (const entry of saved) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
    api.setToken(null);
  }
});

test("teacher assignments view renders catalog assignment and active assignment rows", () => {
  const teacher = { id: "t1", codigo: "T001", nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "987654321" };
  const section = { id: "sec1", nombre: "A", label: "Primaria · Segundo A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · Segundo" };
  const assignment = { id: "as1", profesorId: "t1", cursoId: "c1", gradoId: "2", seccionId: "sec1", anioLectivoId: "y1", cursoOfertaId: null, esTutor: false, activo: true, tipoAsignacion: "curso", curso: { id: "c1", codigo: "MAT", nombre: "Matemática" }, grado: { id: "2", numero: 2, nombre: "Segundo", label: "Segundo" }, seccion: { id: "sec1", nombre: "A", label: "Segundo A" }, profesor: { id: "t1", codigo: "T001", nombres: "Eva", apellidos: "Paz", nombre: "Eva Paz" } };
  const markup = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(TeacherAssignmentsView, { teachers: [teacher], secciones: [section] })), [[assignment], [{ id: "c1", codigo: "MAT", nombre: "Matemática" }], false, { profesorId: "t1", cursoId: "c1", gradoId: "2", seccionId: "sec1", esTutor: "false" }, { mode: "curso", profesorId: "t1", cursoId: "c1", seccionId: "sec1" }]);
  assert.match(markup, /Nueva asignación docente/);
  assert.match(markup, /Matemática/);
  assert.match(markup, /Eva Paz/);
  assert.match(markup, /Tutor de aula/);
  assert.match(markup, /Docente por curso/);
});

test("teacher assignments validates course and runs tutor, course and deactivate actions", async () => {
  const teacher = { id: "t1", codigo: "T001", nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "987654321" };
  const section = { id: "sec1", nombre: "A", label: "Primaria · Segundo A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · Segundo" };
  const assignment = { id: "as1", profesorId: "t1", cursoId: "c1", gradoId: "2", seccionId: "sec1", anioLectivoId: "y1", cursoOfertaId: null, esTutor: false, activo: true, tipoAsignacion: "curso", curso: { id: "c1", codigo: "MAT", nombre: "Matemática" }, grado: { id: "2", numero: 2, nombre: "Segundo", label: "Segundo" }, seccion: { id: "sec1", nombre: "A", label: "Segundo A" }, profesor: { id: "t1", codigo: "T001", nombres: "Eva", apellidos: "Paz", nombre: "Eva Paz" } };
  const names = ["getTeacherAssignments", "createTeacherAssignment", "createTutorAssignment", "deactivateTeacherAssignment"];
  const saved = names.map(name => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  const calls: string[] = [];
  (api as unknown as Record<string, unknown>).getTeacherAssignments = async () => ({ items: [assignment] });
  (api as unknown as Record<string, unknown>).createTeacherAssignment = async () => { calls.push("course"); return {}; };
  (api as unknown as Record<string, unknown>).createTutorAssignment = async () => { calls.push("tutor"); return { totalCursos: 5 }; };
  (api as unknown as Record<string, unknown>).deactivateTeacherAssignment = async () => { calls.push("deactivate"); return {}; };
  try {
    const courseTree = withHookHarness(authFor("admin"), undefined, () => TeacherAssignmentsView({ teachers: [teacher], secciones: [section] }), [[assignment], [{ id: "c1", codigo: "MAT", nombre: "Matemática" }], false, { profesorId: "", cursoId: "", gradoId: "", seccionId: "", esTutor: "" }, { mode: "curso", profesorId: "t1", cursoId: "c1", seccionId: "sec1" }]);
    const courseForm = findElement(courseTree, el => el.type === "form");
    (courseForm!.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    const deactivate = collectElements(courseTree, el => el.type === "button").find(el => String(el.props.children).includes("Desactivar"));
    assert.ok(deactivate);
    (deactivate!.props as { onClick: () => void }).onClick();

    const tutorTree = withHookHarness(authFor("admin"), undefined, () => TeacherAssignmentsView({ teachers: [teacher], secciones: [section] }), [[assignment], [{ id: "c1", codigo: "MAT", nombre: "Matemática" }], false, { profesorId: "", cursoId: "", gradoId: "", seccionId: "", esTutor: "" }, { mode: "tutor", profesorId: "t1", cursoId: "", seccionId: "sec1" }]);
    const tutorForm = findElement(tutorTree, el => el.type === "form");
    (tutorForm!.props as { onSubmit: (event: { preventDefault(): void }) => void }).onSubmit({ preventDefault() {} });
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(calls.sort(), ["course", "deactivate", "tutor"].sort());
  } finally {
    for (const entry of saved) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
  }
});

test("student dashboard and prediction history render complete profile and model provenance", () => {
  const dashboard = {
    profile: { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", email: "ana@example.test", telefono: null, grado: 2, gradoLabel: "Segundo", seccion: "A", salon: "2° A", periodoAcademico: "2026", promedioGeneral: 15, asistenciaGeneral: 92 },
    kpis: { grado: "Segundo", salon: "2° A", promedioGeneral: 15, asistenciaGeneral: 92, nivelRiesgo: "Riesgo medio", alertasActivas: 1 },
    resumen: { ultimaNota: { curso: "Matemática", nota: 18, bimestre: 2, fecha: "2026-10-01" }, ultimaAsistencia: { fecha: "2026-10-02", estado: "Asistió" }, ultimaActividadLms: { fecha: "2026-10-03", tipo: "recurso", minutos: 25 }, ultimaPrediccion: { score: 62, nivel: "Riesgo medio", fecha: "2026-10-04" }, recomendacion: "Mantener el ritmo de estudio" },
    alertasPreview: [{ id: "a1", nivel: "Alto", titulo: "Asistencia por revisar", recomendacion: "Conversar con tutor", estado: "En seguimiento", fecha: "2026-10-05" }],
  };
  const dashboardHtml = withHookHarness(authFor("estudiante"), undefined, () => renderToStaticMarkup(React.createElement(StudentDashboard)), [dashboard, false, false, 0]);
  assert.match(dashboardHtml, /Mi progreso académico/);
  assert.match(dashboardHtml, /Matemática: 18/);
  assert.match(dashboardHtml, /Recurso/);
  assert.match(dashboardHtml, /Conversar con tutor/);

  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · Segundo" };
  const filters = { gradoId: "", seccionId: "", courseId: "", profesorId: "", bimestre: "", estado: "", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const history = [{ id: "p1", studentId: "s1", score: 71.25, level: "alto", probability: null, modelVersion: "v6", modelName: "ensemble", factorsJson: "[]", createdAt: "2026-10-20T10:00:00.000Z", dataMode: "real", datasetVersion: "2026.1", student: { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol" }, meta: { recommendation: "Acompañar semanalmente" } }];
  const historyHtml = withHookHarness(authFor("admin"), undefined, () => renderToStaticMarkup(React.createElement(PredictionHistoryView, { students: [], secciones: [section], courses: [] })), [filters, filters, false, history, false, null, ""]);
  assert.match(historyHtml, /Registros \(1\)/);
  assert.match(historyHtml, /Ana Sol/);
  assert.match(historyHtml, /71\.3/);
  assert.match(historyHtml, /Acompañar semanalmente/);
  assert.match(historyHtml, /ensemble/);
});

test("prediction history uses visible professor filters and retries API failures", async () => {
  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · Segundo" };
  const course = { id: "c1", codigo: "C1", nombre: "Matemática", nivel: "Primaria", profesorId: "t1", seccionId: "sec1" };
  const filters = { gradoId: "2", seccionId: "sec1", courseId: "c1", profesorId: "", bimestre: "", estado: "", search: "  Ana Sol  ", fecha: "", semana: "", riskLevel: "alto", alertStatus: "" };
  const original = (profesorService as unknown as Record<string, unknown>).getHistorialPredicciones;
  const own = Object.hasOwn(profesorService, "getHistorialPredicciones");
  const requested: unknown[] = [];
  (profesorService as unknown as Record<string, unknown>).getHistorialPredicciones = async (params: unknown) => { requested.push(params); if (requested.length > 1) throw new Error("historial temporalmente no disponible"); return { items: [] }; };
  const hadToken = api.hasToken;
  api.setToken("coverage-test-token");
  try {
    const tree = withHookHarness(authFor("docente"), undefined, () => PredictionHistoryView({ students: [], secciones: [section], courses: [course], professorMode: true }), [filters, filters, true, [], false, null, ""]);
    const search = findElement(tree, el => typeof (el.props as { onSearch?: unknown }).onSearch === "function");
    assert.ok(search);
    (search!.props as { onSearch: () => void }).onSearch();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal((requested[0] as { search?: string; cursoId?: string; riskLevel?: string; limit?: number }).search, "Ana Sol");
    assert.equal((requested[0] as { cursoId?: string }).cursoId, "c1");
    assert.equal((requested[0] as { riskLevel?: string }).riskLevel, "alto");

    const errorTree = withHookHarness(authFor("docente"), undefined, () => PredictionHistoryView({ students: [], secciones: [section], courses: [course], professorMode: true }), [filters, filters, true, [], false, "Error anterior", ""]);
    const retry = findElement(errorTree, el => typeof (el.props as { onRetry?: unknown }).onRetry === "function");
    assert.ok(retry);
    (retry!.props as { onRetry: () => void }).onRetry();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(requested.length, 2);
  } finally {
    if (own) (profesorService as unknown as Record<string, unknown>).getHistorialPredicciones = original;
    else delete (profesorService as unknown as Record<string, unknown>).getHistorialPredicciones;
    api.setToken(hadToken ? "coverage-previous-token" : null);
  }
});

test("Bento dashboard maps full API analytics and handles request failure", async () => {
  const original = (api as unknown as Record<string, unknown>).getDashboardKpis;
  const student = { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", nivel: "Primaria · 2° A", estado: "activo", hasGrades: true, hasAttendance: true, storedPrediction: { level: "alto", score: 82, probability: 0.82, factors: [] }, metrics: { promedioGeneral: 12, asistenciaGeneral: 83, lms: { engagement: "medio", actividadSemanalPct: [60], minutosPorSemana: [], actividadesRealizadas: 2, recursosConsultados: 3, horasPlataformaSemana: 1 } } } as never;
  const course = { id: "c1", codigo: "C1", nombre: "Matemática", nivel: "Primaria", profesorId: "t1", seccionId: "sec1" } as never;
  const response = {
    kpis: { avgRisk: 0.72, openAlerts: 2, byLevel: { alto: 1, medio: 1, bajo: 0 }, alertsByLevel: { alto: 1 } },
    ml: { evaluated: 8, evaluatedTotal: 10, avgProbability: 0.42, experimental: true, datasetVersion: "2026.1" },
    riskTrend: [{ periodo: "2026-1", riesgoGlobal: 0.7 }], riskBySection: [{ label: "2° A", alto: 1, medio: 0, bajo: 1, total: 2 }],
    riskByGrado: [{ grado: "Segundo", alto: 1, medio: 1, bajo: 0 }], attendanceByGrado: [{ grado: "Segundo", asistencia: 88 }],
    lmsActivityByGrado: [{ grado: "Segundo", alta: 1, media: 2, baja: 1, sin: 0 }], alertsBySalonShort: [{ salon: "2° A", count: 2 }],
    modelComparison: [{ modelo: "Ensemble", f1: 0.8, accuracy: 0.9 }], featureImportance: [{ variable: "Asistencia", peso: 0.4 }],
  };
  try {
    (api as unknown as Record<string, unknown>).getDashboardKpis = async () => response;
    const effects: React.EffectCallback[] = [];
    const tree = withHookHarness(authFor("admin"), undefined, () => BentoDashboard({ role: "admin", students: [student], courses: [course], matriculaStats: { matriculasActivas: 8, matriculasAnioLectivo: 8, estudiantesActivos: 10, anioLectivo: "2026" }, useApi: true }), [response.kpis, { riskTrend: response.riskTrend, riskBySection: response.riskBySection, riskByGrado: response.riskByGrado, attendanceByGrado: response.attendanceByGrado, lmsActivityByGrado: response.lmsActivityByGrado, alertsBySalonShort: response.alertsBySalonShort, modelComparison: response.modelComparison, featureImportance: response.featureImportance }, response.ml], effects);
    assert.ok(React.isValidElement(tree));
    effects[0]!();
    await new Promise(resolve => setTimeout(resolve, 0));

    (api as unknown as Record<string, unknown>).getDashboardKpis = async () => { throw new Error("sin analítica"); };
    const errorEffects: React.EffectCallback[] = [];
    withHookHarness(authFor("admin"), undefined, () => BentoDashboard({ role: "admin", students: [], courses: [], useApi: true }), [null, null, null], errorEffects);
    errorEffects[0]!();
    await new Promise(resolve => setTimeout(resolve, 0));
  } finally {
    (api as unknown as Record<string, unknown>).getDashboardKpis = original;
  }
});

test("observed LMS progress loads student, teacher and administrator scopes and handles errors", async () => {
  const savedApi = ["getStudents", "call"].map(name => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  const oldLms = (estudianteService as unknown as Record<string, unknown>).getLms;
  const lmsOwn = Object.hasOwn(estudianteService, "getLms");
  const oldProfessorStudents = (profesorService as unknown as Record<string, unknown>).getEstudiantes;
  const professorOwn = Object.hasOwn(profesorService, "getEstudiantes");
  const apiStudent = { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", estado: "activo", nivel: "Primaria · 2° A", promedioGeneral: 15, asistenciaGeneral: 88, indicators: { frecuencia_acceso_lms: 3 }, predictions: [] };
  const calls: string[] = [];
  (api as unknown as Record<string, unknown>).getStudents = async () => { calls.push("admin-students"); return { items: [{ id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol" }] }; };
  (api as unknown as Record<string, unknown>).call = async () => { calls.push("indicators"); return { indicators: { actividades_realizadas: 4, ultimo_acceso: "hoy" } }; };
  (profesorService as unknown as Record<string, unknown>).getEstudiantes = async () => { calls.push("professor-students"); return { items: [apiStudent] }; };
  (estudianteService as unknown as Record<string, unknown>).getLms = async () => { calls.push("student-lms"); return { indicators: { frecuencia_acceso_lms: 5, extra: null } }; };
  try {
    for (const role of ["admin", "docente", "estudiante"] as const) {
      const effects: React.EffectCallback[] = [];
      const auth = authFor(role);
      withHookHarness(auth, undefined, () => ObservedProgressView(), [[], role === "estudiante" ? "" : "s1", {}, "", false], effects);
      effects[0]!();
      await new Promise(resolve => setTimeout(resolve, 0));
      effects[1]!();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    assert.ok(calls.includes("admin-students"));
    assert.ok(calls.includes("professor-students"));
    assert.ok(calls.includes("student-lms"));
    assert.ok(calls.includes("indicators"));

    (api as unknown as Record<string, unknown>).getStudents = async () => { throw new Error("sin alumnos"); };
    const errorEffects: React.EffectCallback[] = [];
    withHookHarness(authFor("admin"), undefined, () => ObservedProgressView(), [[], "", {}, "", false], errorEffects);
    errorEffects[0]!();
    await new Promise(resolve => setTimeout(resolve, 0));
  } finally {
    for (const entry of savedApi) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
    if (lmsOwn) (estudianteService as unknown as Record<string, unknown>).getLms = oldLms;
    else delete (estudianteService as unknown as Record<string, unknown>).getLms;
    if (professorOwn) (profesorService as unknown as Record<string, unknown>).getEstudiantes = oldProfessorStudents;
    else delete (profesorService as unknown as Record<string, unknown>).getEstudiantes;
  }
});

test("audit log loads entries, displays failures and exposes reload and pagination actions", async () => {
  const originalCall = (api as unknown as Record<string, unknown>).call;
  let calls = 0;
  (api as unknown as Record<string, unknown>).call = async () => { calls++; return { items: [{ id: "l1", entidad: "student", accion: "UPDATE", entidadId: "s1", createdAt: "2026-10-20T10:00:00.000Z", usuario: { email: "admin@example.test" }, detalle: "Actualización académica" }], pagination: { pages: 3 } }; };
  try {
    const effects: React.EffectCallback[] = [];
    const tree = withHookHarness(authFor("admin"), undefined, () => AuditView(), [[], 2, 3, false, "", 0], effects);
    effects[0]!();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(calls, 1);
    const errorTree = withHookHarness(authFor("admin"), undefined, () => AuditView(), [[], 2, 3, false, "No se pudo cargar", 0]);
    const retry = findElement(errorTree, el => typeof (el.props as { onRetry?: unknown }).onRetry === "function");
    assert.ok(retry);
    (retry!.props as { onRetry: () => void }).onRetry();
    const buttons = collectElements(tree, el => el.type === "button");
    buttons.forEach(button => (button.props as { onClick: () => void }).onClick());
  } finally {
    if (Object.hasOwn(api, "call")) (api as unknown as Record<string, unknown>).call = originalCall;
    else delete (api as unknown as Record<string, unknown>).call;
  }
});

test("professor prediction search validates the scope, maps students and exposes retry errors", async () => {
  const section = { id: "sec1", nombre: "A", label: "Primaria · 2° A", gradoId: 2, nivelCodigo: "primaria", gradoLabel: "Primaria · Segundo" };
  const course = { id: "c1", codigo: "C1", nombre: "Matemática", nivel: "Primaria", profesorId: "t1", seccionId: "sec1" };
  const filters = { gradoId: "2", seccionId: "sec1", courseId: "c1", profesorId: "", bimestre: "", estado: "", search: " Ana ", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const original = (profesorService as unknown as Record<string, unknown>).getEstudiantes;
  const own = Object.hasOwn(profesorService, "getEstudiantes");
  let calls = 0;
  (profesorService as unknown as Record<string, unknown>).getEstudiantes = async () => { calls++; if (calls > 1) throw new Error("búsqueda no disponible"); return { items: [{ id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", estado: "activo", nivel: "Primaria · 2° A", promedioGeneral: 15, asistenciaGeneral: 88, indicators: {}, predictions: [] }] }; };
  try {
    const tree = withHookHarness(authFor("docente"), undefined, () => ProfessorPredictionView({ courses: [course], secciones: [section] }), [filters, filters, true, [], false, null]);
    const search = findElement(tree, el => typeof (el.props as { onSearch?: unknown }).onSearch === "function");
    assert.ok(search);
    (search!.props as { onSearch: () => void }).onSearch();
    await new Promise(resolve => setTimeout(resolve, 0));
    const errorTree = withHookHarness(authFor("docente"), undefined, () => ProfessorPredictionView({ courses: [course], secciones: [section] }), [filters, filters, true, [], false, "Error previo"]);
    const retry = findElement(errorTree, el => typeof (el.props as { onRetry?: unknown }).onRetry === "function");
    assert.ok(retry);
    (retry!.props as { onRetry: () => void }).onRetry();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(calls, 2);
  } finally {
    if (own) (profesorService as unknown as Record<string, unknown>).getEstudiantes = original;
    else delete (profesorService as unknown as Record<string, unknown>).getEstudiantes;
  }
});

test("academic and professor structure hooks map grades, clear unsupported roles and recover from API errors", async () => {
  const hadToken = api.hasToken;
  const oldApiSections = (api as unknown as Record<string, unknown>).getSecciones;
  const apiOwn = Object.hasOwn(api, "getSecciones");
  const oldProfessorSections = (profesorService as unknown as Record<string, unknown>).getSecciones;
  const professorOwn = Object.hasOwn(profesorService, "getSecciones");
  api.setToken("coverage-test-token");
  try {
    (api as unknown as Record<string, unknown>).getSecciones = async () => ({ items: [
      { id: "sec1", nombre: "A", grado: { id: 2, nombre: "Segundo", nivel: { codigo: "secundaria", nombre: "Secundaria" } } },
      { id: "sec2", nombre: "B", grado: { id: 3, numero: 3, nivel: { codigo: "primaria", nombre: "Primaria" } } },
    ] });
    const director = withHookHarness(authFor("admin"), undefined, () => useAcademicStructure());
    await director.refresh();
    assert.equal(director.loading, false);
    (api as unknown as Record<string, unknown>).getSecciones = async () => { throw new Error("red"); };
    await director.refresh();

    (profesorService as unknown as Record<string, unknown>).getSecciones = async () => ({ items: [
      { id: "p1", nombre: "A", grado: { id: "4", numero: 4, nombre: "Cuarto", nivel: { codigo: "secundaria", nombre: "Secundaria" } } },
      { id: "p2", nombre: "B", grado: { numero: 1, nombre: "Primero" } },
    ] });
    const teacher = withHookHarness(authFor("docente"), undefined, () => useProfessorStructure());
    await teacher.refresh();
    assert.equal(teacher.loading, false);
    (profesorService as unknown as Record<string, unknown>).getSecciones = async () => { throw new Error("sin conexión"); };
    await teacher.refresh();
    const student = withHookHarness(authFor("estudiante"), undefined, () => useProfessorStructure());
    await student.refresh();
  } finally {
    if (apiOwn) (api as unknown as Record<string, unknown>).getSecciones = oldApiSections;
    else delete (api as unknown as Record<string, unknown>).getSecciones;
    if (professorOwn) (profesorService as unknown as Record<string, unknown>).getSecciones = oldProfessorSections;
    else delete (profesorService as unknown as Record<string, unknown>).getSecciones;
    api.setToken(hadToken ? "coverage-previous-token" : null);
  }
});

test("main route covers loading state and redirects an unauthenticated visitor", () => {
  const loading = withHookHarness({ ...authFor("admin"), user: null, loading: true, isAuthenticated: false }, "Dashboard", () => Home());
  const signedOut = withHookHarness({ ...authFor("admin"), user: null, loading: false, isAuthenticated: false }, "Dashboard", () => Home());
  assert.ok(React.isValidElement(loading));
  assert.ok(React.isValidElement(signedOut));
});

test("main route shows the API loading skeleton for a director", () => {
  const token = api.hasToken;
  api.setToken("coverage-test-token");
  try {
    const state = ["Dashboard", "api", true, [], [], [], null, undefined, undefined, undefined, 0];
    const shell = withHookHarness(authFor("admin"), "Dashboard", () => Home(), state) as React.ReactElement<{ children?: React.ReactNode }>;
    assert.ok(shell.props.children);
    assert.equal((shell.props.children as React.ReactElement).type, "div");
  } finally { api.setToken(token ? "coverage-test-token" : null); }
});

test("academic data hook loads director and student scopes and handles missing credentials", async () => {
  const hadToken = api.hasToken;
  api.setToken(null);
  const anonymous = withHookHarness(authFor("admin"), "Dashboard", () => useAcademicData());
  assert.equal(await anonymous.refresh(), false);
  assert.equal(await anonymous.addStudent({} as never), false);
  await anonymous.addTeacher({} as never);
  await anonymous.updateTeacher("t1", {} as never);
  await anonymous.deactivateTeacher("t1");
  await anonymous.createTeacherAccount("t1", "ValidPass1!");
  await anonymous.updateCourse("c1", {});
  await anonymous.deactivateCourse("c1", "Matemática");
  assert.equal(await anonymous.addMatricula({} as never), false);

  api.setToken("coverage-test-token");
  const original = new Map<string, { value: unknown; own: boolean }>();
  const replace = (name: string, value: unknown) => {
    original.set(name, { value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) });
    (api as unknown as Record<string, unknown>)[name] = value;
  };
  const studentRow = { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", correo: null, telefono: null, estado: "activo", promedioGeneral: null, asistenciaGeneral: null, seccion: null, nivel: null, indicators: { promedio_general: null, asistencia_general: null }, predictions: [], enrolledCourseIds: [] };
  const rowPage = { items: [], page: 1, limit: 200, total: 0, pages: 1 };
  const confirm = globalThis.window?.confirm;
  try {
    replace("health", async () => ({}));
    replace("getStudents", async () => rowPage);
    replace("getTeachers", async () => ({ items: [] }));
    replace("getCourses", async () => ({ items: [] }));
    replace("getMatriculaStats", async () => ({ matriculasActivas: 0, matriculasAnioLectivo: 0, estudiantesActivos: 0, anioLectivo: "2026" }));
    replace("createStudent", async () => ({ student: studentRow, credentials: { email: "ana@example.test", temporaryPassword: "temporal" } }));
    replace("createTeacher", async () => ({}));
    replace("updateTeacher", async () => ({}));
    replace("deleteTeacher", async () => ({}));
    replace("createTeacherAccount", async () => ({}));
    replace("reassignCourse", async () => ({}));
    replace("updateCourse", async () => ({}));
    replace("deleteCourse", async () => ({}));
    replace("createMatricula", async () => ({}));
    replace("getSecciones", async () => ({ items: [] }));
    globalThis.window = { ...globalThis.window, confirm: () => true } as Window & typeof globalThis;
    const director = withHookHarness(authFor("admin"), "Dashboard", () => useAcademicData());
    assert.equal(await director.refresh(), true);
    assert.equal(await director.addStudent({ nombres: "Ana", apellidos: "Sol", seccionId: "sec1", dni: "12345678", correo: "", telefono: "" }), true);
    assert.equal(await director.addTeacher({ dni: "12345678", nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "", crearCuenta: false, password: "" }), true);
    await director.updateTeacher("t1", { nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "" });
    await director.deactivateTeacher("t1");
    await director.createTeacherAccount("t1", "ValidPass1!");
    await director.updateCourse("c1", { profesorId: "t1" });
    await director.updateCourse("c1", { nombre: "Ciencias" });
    await director.deactivateCourse("c1", "Ciencias");
    assert.equal(await director.addMatricula({ estudianteId: "s1", seccionId: "sec1", anioLectivoId: "2026" }), true);

    const student = withHookHarness({ ...authFor("estudiante"), user: { ...authFor("estudiante").user, role: "estudiante" } }, "Dashboard", () => useAcademicData());
    assert.equal(await student.refresh(), true);
  } finally {
    for (const [name, previous] of original) {
      if (previous.own) (api as unknown as Record<string, unknown>)[name] = previous.value;
      else delete (api as unknown as Record<string, unknown>)[name];
    }
    if (confirm) globalThis.window.confirm = confirm;
    else delete (globalThis as { window?: Window }).window;
    api.setToken(hadToken ? "coverage-previous-token" : null);
  }
});

test("academic data retries after session refresh and reports failed loads and mutations", async () => {
  const hadToken = api.hasToken;
  api.setToken("coverage-test-token");
  const names = ["health", "getStudents", "getTeachers", "getCourses", "getMatriculaStats", "createStudent", "createTeacher", "updateTeacher", "deleteTeacher", "createTeacherAccount", "updateCourse", "deleteCourse", "createMatricula"];
  const saved = names.map(name => ({ name, value: (api as unknown as Record<string, unknown>)[name], own: Object.hasOwn(api, name) }));
  const fail = async () => { throw new Error("fallo de API de prueba"); };
  const studentRow = { id: "s1", codigo: "S001", nombres: "Ana", apellidos: "Sol", correo: null, telefono: null, estado: "activo", promedioGeneral: null, asistenciaGeneral: null, seccion: null, nivel: null, indicators: { promedio_general: null, asistencia_general: null }, predictions: [], enrolledCourseIds: [] };
  try {
    (api as unknown as Record<string, unknown>).health = fail;
    (api as unknown as Record<string, unknown>).getStudents = async () => ({ items: [studentRow], page: 1, limit: 200, total: 1, pages: 1 });
    (api as unknown as Record<string, unknown>).getTeachers = async () => ({ items: [] });
    (api as unknown as Record<string, unknown>).getCourses = async () => ({ items: [] });
    (api as unknown as Record<string, unknown>).getMatriculaStats = fail;
    const refreshed = withHookHarness({ ...authFor("admin"), refresh: async () => undefined }, undefined, () => useAcademicData());
    assert.equal(await refreshed.refresh(), true);

    const unavailable = withHookHarness({ ...authFor("admin"), refresh: fail }, undefined, () => useAcademicData());
    assert.equal(await unavailable.refresh(), false);

    (api as unknown as Record<string, unknown>).createStudent = fail;
    (api as unknown as Record<string, unknown>).createTeacher = fail;
    (api as unknown as Record<string, unknown>).updateTeacher = fail;
    (api as unknown as Record<string, unknown>).deleteTeacher = fail;
    (api as unknown as Record<string, unknown>).createTeacherAccount = fail;
    (api as unknown as Record<string, unknown>).updateCourse = fail;
    (api as unknown as Record<string, unknown>).deleteCourse = fail;
    (api as unknown as Record<string, unknown>).createMatricula = fail;
    (api as unknown as Record<string, unknown>).health = async () => ({});
    const data = withHookHarness(authFor("admin"), undefined, () => useAcademicData());
    const studentForm = { nombres: "Ana", apellidos: "Sol", seccionId: "sec1", dni: "12345678", correo: "", telefono: "" };
    const teacherForm = { dni: "12345678", nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "", crearCuenta: false, password: "" };
    assert.equal(await data.addStudent({ ...studentForm, dni: "bad" }), false);
    assert.equal(await data.addStudent(studentForm), false);
    assert.equal(await data.addTeacher({ ...teacherForm, correo: "bad" }), false);
    await data.addTeacher(teacherForm);
    await data.updateTeacher("t1", { nombres: "Eva", apellidos: "Paz", especialidad: "Ciencias", correo: "eva@example.test", telefono: "" });
    await data.deactivateTeacher("t1");
    await data.createTeacherAccount("t1", "weak");
    await data.createTeacherAccount("t1", "ValidPass1!");
    await data.updateCourse("c1", { nombre: "Ciencias" });
    const oldConfirm = globalThis.window?.confirm;
    globalThis.window = { ...globalThis.window, confirm: () => true } as Window & typeof globalThis;
    await data.deactivateCourse("c1", "Ciencias");
    await data.addMatricula({ estudianteId: "s1", seccionId: "sec1", anioLectivoId: "2026" });
    if (oldConfirm) globalThis.window.confirm = oldConfirm;
    else delete (globalThis as { window?: Window }).window;
  } finally {
    for (const entry of saved) {
      if (entry.own) (api as unknown as Record<string, unknown>)[entry.name] = entry.value;
      else delete (api as unknown as Record<string, unknown>)[entry.name];
    }
    api.setToken(hadToken ? "coverage-previous-token" : null);
  }
});
