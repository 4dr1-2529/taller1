import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Activity, Users } from "lucide-react";
import { AuthContext } from "../src/contexts/AuthProvider.js";
import { ThemeProvider } from "../src/contexts/ThemeProvider.js";
import { parseTheme, themeCookieValue } from "../src/lib/theme.js";
import { DataSourceBanner } from "../src/components/DataSourceBanner.js";
import { InstitutionOverview } from "../src/components/dashboard/InstitutionOverview.js";
import { RoleDashboard } from "../src/components/dashboard/RoleDashboard.js";
import { DashboardMetricCard } from "../src/components/dashboard/DashboardMetricCard.js";
import { DashboardKpi } from "../src/components/ui/DashboardKpi.js";
import { KpiCard } from "../src/components/ui/KpiCard.js";
import { ThemeToggle } from "../src/components/ui/ThemeToggle.js";
import { AppHeader } from "../src/components/layout/AppHeader.js";
import { Providers } from "../src/components/Providers.js";
import { EmptyState } from "../src/components/EmptyState.js";

const signedOut = { user: null, token: null, loading: false, login: async () => {}, logout: () => {}, refresh: async () => {}, isAuthenticated: false, hasRole: () => false, isAdmin: false, isDocente: false, isEstudiante: false };
const signedIn = { ...signedOut, user: { sub: "1", role: "admin", email: "directora@example.test", nombres: "Ana", apellidos: "Sol" }, isAuthenticated: true, isAdmin: true, hasRole: roles => roles.includes("admin") };
function html(node, auth = signedOut) { return renderToStaticMarkup(createElement(AuthContext.Provider, { value: auth }, node)); }

test("theme utilities accept only supported themes and serialize cookie attributes", () => {
  assert.equal(parseTheme("light"), "light");
  assert.equal(parseTheme("dark"), "dark");
  assert.equal(parseTheme(undefined), null);
  assert.equal(parseTheme(null), null);
  assert.equal(parseTheme("system"), null);
  assert.equal(themeCookieValue("dark"), "tesis-theme=dark;path=/;max-age=31536000;SameSite=Lax");
});

test("data source banner covers live data, unauthenticated setup and authenticated recovery", () => {
  const live = html(createElement(DataSourceBanner, { dataSource: "api" }));
  const setup = html(createElement(DataSourceBanner, { dataSource: "none" }));
  const recovery = html(createElement(DataSourceBanner, { dataSource: "none", loading: true, onRefresh: () => {} }), signedIn);
  assert.match(live, /Datos en tiempo real/);
  assert.match(setup, /Iniciar sesión/);
  assert.match(recovery, /vuelva a iniciar sesión/);
  assert.match(recovery, /disabled/);
});

test("institution overview renders optional director email and student/staff totals", () => {
  const full = html(createElement(InstitutionOverview, { institutionName: "Blenkir", directorName: "Ana Sol", directorEmail: "ana@example.test", totalStudents: 250, totalTeachers: 24 }));
  const basic = html(createElement(InstitutionOverview, { institutionName: "Blenkir", directorName: "Dirección", totalStudents: 0, totalTeachers: 0 }));
  assert.match(full, /ana@example.test/);
  assert.match(full, /250/);
  assert.match(full, /24/);
  assert.doesNotMatch(basic, /<small>/);
});

test("metric cards cover optional description, suffix and KPI trend directions", () => {
  const base = html(createElement(DashboardMetricCard, { label: "Alumnos", value: 250, icon: Users }));
  const desc = html(createElement(DashboardMetricCard, { label: "Cursos", value: 8, suffix: " activos", icon: Activity, tone: "success", description: "Periodo actual", index: 2 }));
  const up = html(createElement(DashboardKpi, { label: "Ingresos", value: 4, icon: Activity, badge: "Nuevo", badgeTone: "success", trend: { value: "+2", up: true } }));
  const down = html(createElement(DashboardKpi, { label: "Riesgo", value: 2, icon: Activity, badgeTone: "danger", trend: { value: "-1" } }));
  const none = html(createElement(DashboardKpi, { label: "Sin cambios", value: "—", icon: Activity }));
  const mapped = html(createElement(KpiCard, { label: "Balance", value: 7, icon: Activity, variant: "amber", subtitle: "Este mes" }));
  assert.match(base, /250/);
  assert.match(desc, /Periodo actual/);
  assert.match(desc, /activos/);
  assert.match(up, /Nuevo/);
  assert.match(up, /\+2/);
  assert.match(down, /-1/);
  assert.match(none, /Sin cambios/);
  assert.match(mapped, /Este mes/);
});

test("role dashboard renders director, teacher and student branches", () => {
  const empty = [];
  const admin = html(createElement(RoleDashboard, { role: "admin", students: empty, courses: empty }), signedIn);
  const student = html(createElement(RoleDashboard, { role: "estudiante", students: empty, courses: empty }), signedIn);
  const teacher = html(createElement(RoleDashboard, { role: "docente", students: empty, courses: empty }), signedIn);
  assert.match(admin, /Centro de comando institucional/);
  assert.match(admin, /Total estudiantes/);
  assert.match(student, /bento-grid/);
  assert.match(teacher, /dashboard/);
});

test("header renders breadcrumbs, identity, role and theme control", () => {
  const result = html(createElement(ThemeProvider, null, createElement(AppHeader, { activeSection: "dashboard", subtitle: "Resumen anual" })), signedIn);
  assert.match(result, /Ruta de la página/);
  assert.match(result, /Resumen anual/);
  assert.match(result, /AS/);
  assert.match(result, /Director/);
  assert.match(result, /Modo oscuro/);
});

test("theme toggle labels its action from the current theme", () => {
  const light = html(createElement(ThemeProvider, null, createElement(ThemeToggle)));
  assert.match(light, /Modo oscuro/);
});

test("providers compose context providers and preserve children", () => {
  const result = html(createElement(Providers, null, createElement("p", null, "Aplicación lista")));
  assert.match(result, /Aplicación lista/);
});

test("empty state covers login action, custom action and default icon", () => {
  const login = html(createElement(EmptyState, { title: "Sin sesión", description: "Entre al sistema", showLogin: true }));
  const action = html(createElement(EmptyState, { title: "Vacío", description: "Sin registros", actionLabel: "Ignorado", action: createElement("button", null, "Crear") }));
  assert.match(login, /Iniciar sesión/);
  assert.match(action, /Crear/);
  assert.match(action, /Sin registros/);
});


import ErrorBoundary from "../src/app/error.js";
import GlobalError from "../src/app/global-error.js";
import NotFound from "../src/app/not-found.js";
import AuthLayout from "../src/app/(auth)/layout.js";
import ShellLayout from "../src/app/(shell)/layout.js";
import LoginLoading from "../src/app/(auth)/login/loading.js";
import { AppShell } from "../src/components/layout/AppShell.js";

test("framework fallbacks render local error, global error, not-found and login loading", () => {
  const reset = () => {};
  const local = html(createElement(ErrorBoundary, { error: new Error("local"), reset }));
  const global = html(createElement(GlobalError, { error: new Error("global"), reset }));
  const missing = renderToStaticMarkup(createElement(NotFound));
  const loading = renderToStaticMarkup(createElement(LoginLoading));
  assert.match(local, /Error inesperado/);
  assert.match(local, /Reintentar/);
  assert.doesNotMatch(local, /<html/);
  assert.match(global, /<html lang="es">/);
  assert.match(global, /<title>Error inesperado<\/title>/);
  assert.match(missing, /Página no encontrada/);
  assert.match(missing, /Volver al inicio/);
  assert.match(loading, /Cargando login/);
});

test("auth and shell route layouts provide contexts and preserve content", () => {
  const child = createElement("main", null, "Ruta preparada");
  assert.match(html(createElement(AuthLayout, null, child)), /Ruta preparada/);
  assert.match(html(createElement(ShellLayout, null, child)), /Ruta preparada/);
});

test("app shell renders the skip link, main view and data-source states", () => {
  const props = { sections: ["dashboard"], activeSection: "dashboard", onSelectSection: () => {}, alertCount: 0, subtitle: "Resumen", dataSource: "none", loading: false, onRefresh: () => {} };
  const anonymous = html(createElement(ThemeProvider, null, createElement(AppShell, props, createElement("p", null, "Contenido principal"))));
  const authenticated = html(createElement(ThemeProvider, null, createElement(AppShell, { ...props, dataSource: "api" }, createElement("p", null, "Datos actuales"))), signedIn);
  assert.match(anonymous, /Saltar al contenido principal/);
  assert.match(anonymous, /Contenido principal/);
  assert.match(anonymous, /Iniciar sesión/);
  assert.match(authenticated, /Datos actuales/);
  assert.doesNotMatch(authenticated, /Datos en tiempo real desde la API/);
});
import { api } from "../src/services/api.js";
import { directorService } from "../src/services/directorService.js";
import { fetchAllStudents } from "../src/lib/fetch-all-students.js";

test("director service forwards optional filters and query arguments to the shared API", async () => {
  const originalStudents = api.getStudents;
  const originalTeacherStudents = api.getProfesorEstudiantes;
  const originalPredictions = api.getPredictions;
  const studentArgs = [];
  let predictionArgs;
  api.getStudents = async (...args) => { studentArgs.push(args); return { items: [], page: 1, limit: 10, total: 0, pages: 1 }; };
  api.getPredictions = async args => { predictionArgs = args; return { items: [], total: 0, page: 1, pages: 1 }; };
  try {
    await directorService.getStudents(2, 50, "Ana");
    await directorService.getStudents();
    await directorService.getPredictions({ page: 3, riskLevel: "alto" });
    assert.deepEqual(studentArgs, [[2, 50, "Ana"], [undefined, undefined, undefined]]);
    assert.deepEqual(predictionArgs, { page: 3, riskLevel: "alto" });
  } finally {
    api.getStudents = originalStudents;
    api.getPredictions = originalPredictions;
  }
});

test("fetchAllStudents paginates director and professor scopes and maps each row", async () => {
  const originalStudents = api.getStudents;
  const originalProfessorStudents = api.getProfesorEstudiantes;
  const calls = [];
  const row = (id, nombres) => ({ id, codigo: id, nombres, apellidos: "Prueba", dni: null, correo: null, telefono: null, estado: "activo", seccion: null, promedioGeneral: null, asistenciaGeneral: null, lms: null });
  api.getStudents = async (page, limit, q) => {
    calls.push(["director", page, limit, q]);
    return page === 1 ? { items: [row("1", "Ana")], page: 1, limit, total: 3, pages: 2 } : { items: [row("2", "Beto"), row("3", "Ceci")], page, limit, total: 3, pages: 2 };
  };
  api.getProfesorEstudiantes = async (page, limit, q) => {
    calls.push(["teacher", page, limit, q]);
    return page === 1 ? { items: [row("4", "Dani")], page: 1, limit, total: 2, pages: 2 } : { items: [row("5", "Eva")], page, limit, total: 2, pages: 2 };
  };
  try {
    const director = await fetchAllStudents();
    assert.deepEqual(director.map(s => s.id), ["1", "2", "3"]);
    assert.deepEqual(calls, [["director", 1, 200, undefined], ["director", 2, 200, undefined]]);
    calls.length = 0;
    const teacher = await fetchAllStudents(true);
    assert.deepEqual(teacher.map(s => s.id), ["4", "5"]);
    assert.deepEqual(calls, [["teacher", 1, 200, undefined], ["teacher", 2, 200, undefined]]);
  } finally {
    api.getStudents = originalStudents;
    api.getProfesorEstudiantes = originalProfessorStudents;
  }
});

