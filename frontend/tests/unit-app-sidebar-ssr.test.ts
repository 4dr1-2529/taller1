import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthContext, AuthProvider } from "../src/contexts/AuthProvider.js";
import { AppSidebar } from "../src/components/AppSidebar.js";

function render(sections, activeSection, alertCount) {
  return renderToStaticMarkup(createElement(AuthProvider, null, createElement(AppSidebar, {
    sections, activeSection, alertCount, onSelect: () => undefined,
  })));
}

test("AppSidebar SSR presenta navegación agrupada, sección activa y alerta singular o plural", () => {
  const html = render(["Dashboard", "Alertas", "Estudiantes", "Notas", "Asistencia"], "Alertas", 1);
  assert.match(html, /Navegación principal/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /1 alerta activa/);
  assert.match(html, /Dashboard/);
  assert.match(html, /Alertas/);
  assert.match(html, /Estudiantes/);
  assert.match(html, /Notas/);
  assert.match(html, /Asistencia/);
  assert.match(html, /Colapsar/);
  assert.doesNotMatch(html, /Cerrar sesión/);
});

test("AppSidebar SSR no inventa alerta cuando el contador es cero y respeta secciones vacías", () => {
  const empty = render([], "Dashboard", 0);
  assert.match(empty, /aria-label="Navegación principal"/);
  assert.doesNotMatch(empty, /aria-current="page"/);
  assert.doesNotMatch(empty, /alerta activa/);
  const plural = render(["Alertas"], "Alertas", 12);
  assert.match(plural, /12 alertas activas/);
  assert.match(plural, /aria-current="page"/);
});

test("AppSidebar SSR muestra identidad autenticada y acción de cierre de sesión", () => {
  const auth = {
    user: { sub: "u1", role: "docente", email: "ana@example.test", nombres: "ana", apellidos: "paz" },
    isAuthenticated: true,
    logout: () => undefined,
  } as any;
  const html = renderToStaticMarkup(createElement(
    AuthContext.Provider,
    { value: auth },
    createElement(AppSidebar, { sections: ["Dashboard", "Notas"], activeSection: "Notas", alertCount: 0, onSelect: () => undefined }),
  ));
  assert.match(html, /ana paz/);
  assert.match(html, /AP/);
  assert.match(html, /Profesor/);
  assert.match(html, /Cerrar sesión/);
});
