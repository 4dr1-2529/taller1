import test from "node:test";
import assert from "node:assert/strict";
import {
  seccionCodigoSuffix,
  buildCourseCodigoForSeccion,
  formatSeccionCourseLabel,
} from "../../src/utils/course-section.js";

const seccion = (overrides = {}) => ({
  id: "sec-1",
  nombre: "A",
  grado: { numero: 2, nombre: "Secundaria", nivel: { codigo: "secundaria" } },
  ...overrides,
});

test("seccionCodigoSuffix combina grado y nombre", () => {
  assert.strictEqual(seccionCodigoSuffix(seccion()), "2A");
  assert.strictEqual(seccionCodigoSuffix({ ...seccion(), nombre: "B", grado: { ...seccion().grado, numero: 6 } }), "6B");
});

test("buildCourseCodigoForSeccion no duplica sufijo ya presente", () => {
  assert.strictEqual(buildCourseCodigoForSeccion("MAT-2A", seccion()), "MAT-2A");
  assert.strictEqual(buildCourseCodigoForSeccion("MAT101-2A", seccion()), "MAT101-2A");
});

test("buildCourseCodigoForSeccion agrega sufijo y trunca a 32", () => {
  const resultado = buildCourseCodigoForSeccion("MAT101", seccion());
  assert.strictEqual(resultado, "MAT101-2A");
});

test("buildCourseCodigoForSeccion trunca cuando excede 32 caracteres", () => {
  const base = "MAT101".repeat(6); // 36 caracteres
  const resultado = buildCourseCodigoForSeccion(base, seccion());
  assert.ok(resultado.length <= 32);
});

test("formatSeccionCourseLabel primaria y secundaria", () => {
  const s = seccion();
  assert.strictEqual(
    formatSeccionCourseLabel({ ...s, grado: { ...s.grado, nivel: { codigo: "secundaria" } } }),
    `Secundaria · ${s.grado.nombre} ${s.nombre}`,
  );
  assert.strictEqual(
    formatSeccionCourseLabel({ ...s, grado: { ...s.grado, nivel: { codigo: "primaria" } } }),
    `Primaria · ${s.grado.nombre} ${s.nombre}`,
  );
});
