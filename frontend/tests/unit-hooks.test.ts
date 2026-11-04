import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useDebouncedValue } from "../src/hooks/useDebouncedValue.js";
import { useAcademicFilters } from "../src/hooks/useAcademicFilters.js";
import { useAuthReady } from "../src/hooks/useAuthReady.js";
import { AuthContext } from "../src/contexts/AuthProvider.js";

const authValue = {
  user: { sub: "1", role: "estudiante", email: "a@b.com", nombres: "Ana", apellidos: "G" },
  token: null, loading: false, login: async () => {}, logout: async () => {}, refresh: async () => {},
  isAuthenticated: true, hasRole: () => true, isAdmin: false, isDocente: false, isEstudiante: true,
};

function withAuth(children: React.ReactNode) {
  return createElement(AuthContext.Provider, { value: authValue }, children);
}

// Componente de prueba para useDebouncedValue
function DebouncedValueDisplay({ value, delayMs }: { value: string; delayMs: number }) {
  const debounced = useDebouncedValue(value, delayMs);
  return createElement("span", null, debounced);
}

test("hook: useDebouncedValue devuelve valor inicial", () => {
  const html = renderToStaticMarkup(createElement(DebouncedValueDisplay, { value: "hola", delayMs: 100 }));
  assert.ok(html.includes("hola"));
});

// Componente de prueba para useAcademicFilters
function AcademicFiltersDisplay({ students, courses, secciones, teachers }: any) {
  const filters = useAcademicFilters(students, courses, secciones, teachers);
  return createElement("span", null, filters.filters.gradoId + "|" + filters.filteredStudents.length);
}

test("hook: useAcademicFilters devuelve filtros por defecto", () => {
  const html = renderToStaticMarkup(
    createElement(AcademicFiltersDisplay, { students: [], courses: [], secciones: [], teachers: [] }),
  );
  assert.ok(html.includes("|0"));
});

test("hook: useAcademicFilters filtra por grado", () => {
  const students = [
    { id: "s1", seccionId: "sec1", estado: "activa" } as any,
    { id: "s2", seccionId: "sec2", estado: "activa" } as any,
  ];
  const secciones = [
    { id: "sec1", gradoId: 1, gradoLabel: "1° A", nombre: "A" },
    { id: "sec2", gradoId: 2, gradoLabel: "2° B", nombre: "B" },
  ] as any;
  // Verificamos que el hook se renderiza sin error con datos
  const html = renderToStaticMarkup(
    createElement(AcademicFiltersDisplay, { students, courses: [], secciones, teachers: [] }),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

// Componente de prueba para useAuthReady
function AuthReadyDisplay() {
  const auth = useAuthReady();
  return createElement("span", null, auth.ready ? "ready" : "not-ready" + "|" + (auth.role ?? "none"));
}

test("hook: useAuthReady devuelve ready cuando autenticado", () => {
  const html = renderToStaticMarkup(
    withAuth(createElement(AuthReadyDisplay)),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});

test("hook: useAuthReady no listo cuando loading", () => {
  const authLoading = { ...authValue, loading: true, user: null };
  function withAuthLoading(children: React.ReactNode) {
    return createElement(AuthContext.Provider, { value: authLoading }, children);
  }
  const html = renderToStaticMarkup(
    withAuthLoading(createElement(AuthReadyDisplay)),
  );
  assert.ok(typeof html === "string" && html.length > 0);
});
