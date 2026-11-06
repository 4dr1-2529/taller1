import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthContext, AuthProvider } from "../src/contexts/AuthProvider.js";
import {
  AppSidebar,
  getSidebarInitials,
  installMobileNavigationBehavior,
  readSidebarCollapsed,
  toggleSidebarCollapsed,
} from "../src/components/AppSidebar.js";

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

test("sidebar persistence reads stored collapse state and writes both toggle directions", () => {
  let stored: string | null = null;
  const storage = {
    getItem: () => stored,
    setItem: (_key: string, value: string) => { stored = value; },
  };
  assert.equal(readSidebarCollapsed(storage), false);
  stored = "1";
  assert.equal(readSidebarCollapsed(storage), true);
  assert.equal(toggleSidebarCollapsed(true, storage), false);
  assert.equal(stored, "0");
  assert.equal(toggleSidebarCollapsed(false, storage), true);
  assert.equal(stored, "1");
  assert.equal(getSidebarInitials("ana", "paz"), "AP");
  assert.equal(getSidebarInitials("", ""), "");
});

test("mobile navigation traps focus, closes on Escape and restores inert state", () => {
  let active: any;
  const first = { focus() { active = first; }, getClientRects: () => [{ width: 1 }] };
  const last = { focus() { active = last; }, getClientRects: () => [{ width: 1 }] };
  const hidden = { focus() { active = hidden; }, getClientRects: () => [] };
  const main: any = { inert: false };
  const trigger = { focus() { active = trigger; } };
  const listeners = new Map<string, (event: any) => void>();
  const doc: any = {
    activeElement: undefined,
    querySelector: (selector: string) => selector === ".app-main" ? main : null,
    addEventListener: (name: string, listener: (event: any) => void) => listeners.set(name, listener),
    removeEventListener: (name: string) => listeners.delete(name),
  };
  Object.defineProperty(doc, "activeElement", { get: () => active });
  const drawer = {
    querySelector: () => first,
    querySelectorAll: () => [first, hidden, last],
  };
  const closeCalls: boolean[] = [];
  const cleanup = installMobileNavigationBehavior(doc, trigger as any, drawer as any, (open) => closeCalls.push(open));

  assert.equal(main.inert, true);
  assert.equal(active, first);
  let prevented = false;
  listeners.get("keydown")!({ key: "Tab", shiftKey: true, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(active, last);
  prevented = false;
  listeners.get("keydown")!({ key: "Tab", shiftKey: false, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(active, first);
  prevented = false;
  listeners.get("keydown")!({ key: "ArrowDown", shiftKey: false, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, false);
  listeners.get("keydown")!({ key: "Escape", preventDefault: () => { prevented = true; } });
  assert.equal(closeCalls.at(-1), false);
  assert.equal(prevented, true);
  cleanup();
  assert.equal(main.inert, false);
  assert.equal(active, trigger);
  assert.equal(listeners.size, 0);
});

test("mobile navigation handles a missing drawer and preserves an already inert main", () => {
  const main: any = { inert: true };
  const listeners = new Map<string, (event: any) => void>();
  const doc: any = {
    activeElement: null,
    querySelector: () => main,
    addEventListener: (name: string, listener: (event: any) => void) => listeners.set(name, listener),
    removeEventListener: (name: string) => listeners.delete(name),
  };
  const closeCalls: boolean[] = [];
  const cleanup = installMobileNavigationBehavior(doc, null, null, (open) => closeCalls.push(open));
  let prevented = false;
  listeners.get("keydown")!({ key: "Tab", shiftKey: false, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, false);
  listeners.get("keydown")!({ key: "Escape", preventDefault: () => { prevented = true; } });
  assert.equal(closeCalls.at(-1), false);
  cleanup();
  assert.equal(main.inert, true);
  assert.equal(listeners.size, 0);
});
