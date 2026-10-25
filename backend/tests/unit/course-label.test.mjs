import test from "node:test";
import assert from "node:assert/strict";
import { courseDisplayName, mapCourseForApi } from "../../src/utils/course-label.js";

test("courseDisplayName usa nombre del catálogo cuando existe", () => {
  const course = { codigo: "MAT101", cursoCatalogo: { nombre: "Matemáticas" } };
  assert.strictEqual(courseDisplayName(course), "Matemáticas");
});

test("courseDisplayName usa código cuando no hay catálogo", () => {
  const course = { codigo: "MAT101", cursoCatalogo: null };
  assert.strictEqual(courseDisplayName(course), "MAT101");
});

test("courseDisplayName usa código cuando catálogo no tiene nombre", () => {
  const course = { codigo: "MAT101", cursoCatalogo: { nombre: null } };
  assert.strictEqual(courseDisplayName(course), "MAT101");
});

test("mapCourseForApi agrega nombre calculado", () => {
  const course = { codigo: "MAT101", cursoCatalogo: { nombre: "Matemáticas" }, creditos: 4 };
  const result = mapCourseForApi(course);
  assert.strictEqual(result.nombre, "Matemáticas");
  assert.strictEqual(result.codigo, "MAT101");
  assert.strictEqual(result.creditos, 4);
});
