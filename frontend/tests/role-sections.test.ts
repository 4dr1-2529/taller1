import assert from "node:assert/strict";
import { test } from "node:test";
import { ROLE_SECTIONS } from "../src/data/role-sections";
import { APP_SECTIONS, type AppSection } from "../src/data/navigation";

test("sólo existen los 3 roles vigentes (no se crea un cuarto rol)", () => {
  assert.deepEqual(Object.keys(ROLE_SECTIONS), ["admin", "docente", "estudiante"]);
});

test("todas las secciones declaradas son secciones reales de la app", () => {
  const validas = new Set<string>(APP_SECTIONS);
  for (const [role, sections] of Object.entries(ROLE_SECTIONS)) {
    for (const s of sections) {
      assert.ok(validas.has(s), `${role}: sección desconocida "${s}"`);
    }
  }
});

test("estudiante incluye Alertas (Mis alertas)", () => {
  assert.ok(ROLE_SECTIONS.estudiante.includes("Alertas"));
});

test("estudiante ve sólo información propia", () => {
  for (const prohibida of ["Estudiantes", "Profesores", "Asignaciones", "Matrículas", "Auditoría", "Historial predicciones", "Reportes"]) {
    assert.ok(
      !ROLE_SECTIONS.estudiante.includes(prohibida as AppSection),
      `estudiante no debe ver "${prohibida}"`,
    );
  }
  for (const requerida of ["Cursos", "Notas", "Asistencia", "Actividad LMS", "Predicción", "Alertas", "Mensajería Académica"]) {
    assert.ok(ROLE_SECTIONS.estudiante.includes(requerida as AppSection), `estudiante debe ver "${requerida}"`);
  }
});

test("director administra matrículas y asignaciones; profesor no", () => {
  assert.ok(ROLE_SECTIONS.admin.includes("Matrículas"));
  assert.ok(ROLE_SECTIONS.admin.includes("Asignaciones"));
  assert.ok(ROLE_SECTIONS.admin.includes("Estudiantes"));
  assert.ok(ROLE_SECTIONS.admin.includes("Profesores"));
  assert.ok(!ROLE_SECTIONS.docente.includes("Matrículas"));
  assert.ok(!ROLE_SECTIONS.docente.includes("Asignaciones"));
  assert.ok(!ROLE_SECTIONS.docente.includes("Profesores"));
});

test("profesor tiene su ámbito: cursos, estudiantes, notas, asistencia, predicción y alertas", () => {
  for (const requerida of ["Cursos", "Estudiantes", "Notas", "Asistencia", "Predicción", "Historial predicciones", "Alertas", "Materiales", "Actividades", "Actividad LMS"]) {
    assert.ok(ROLE_SECTIONS.docente.includes(requerida as AppSection), `docente debe ver "${requerida}"`);
  }
});
