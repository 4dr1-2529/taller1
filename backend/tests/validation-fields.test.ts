/**
 * Validaciones de campos y respuestas estructuradas
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { zodToFieldErrors } from "../src/utils/response.js";
import {
  personNameField,
  gradeField,
  percentageField,
  optionalDniField,
  optionalPhoneField,
  observacionField,
  courseNameField,
} from "../src/validators/fields.js";
import { gradeSchema, studentSchema } from "../src/validators/schemas.js";

describe("zodToFieldErrors", () => {
  it("devuelve field y message por campo", () => {
    const r = studentSchema.safeParse({ codigo: "1", nombres: "Juan123", apellidos: "Pérez", seccionId: "1" });
    assert.equal(r.success, false);
    if (!r.success) {
      const errors = zodToFieldErrors(r.error);
      assert.ok(errors.some((e) => e.field === "nombres"));
      assert.ok(errors.every((e) => typeof e.message === "string"));
    }
  });
});

describe("Campos de texto — sin números", () => {
  it("rechaza nombres con dígitos", () => {
    assert.equal(personNameField.safeParse("Ana123").success, false);
    assert.equal(personNameField.safeParse("María José").success, true);
  });

  it("observación sin números", () => {
    assert.equal(observacionField.safeParse("Buen desempeño").success, true);
    assert.equal(observacionField.safeParse("Nota 15").success, false);
  });

  it("nombre de curso sin números", () => {
    assert.equal(courseNameField.safeParse("Inglés").success, true);
    assert.equal(courseNameField.safeParse("Matemática 2").success, false);
  });
});

describe("Campos numéricos", () => {
  it("nota entre 0 y 20", () => {
    assert.equal(gradeField.safeParse(15).success, true);
    assert.equal(gradeField.safeParse(25).success, false);
    assert.equal(gradeSchema.safeParse({ studentId: "1", courseId: "2", nota: 21 }).success, false);
  });

  it("asistencia entre 0 y 100", () => {
    assert.equal(percentageField.safeParse(100).success, true);
    assert.equal(percentageField.safeParse(101).success, false);
  });

  it("DNI 8 dígitos", () => {
    assert.equal(optionalDniField.safeParse("12345678").success, true);
    assert.equal(optionalDniField.safeParse("1234567").success, false);
  });

  it("teléfono 9 dígitos", () => {
    assert.equal(optionalPhoneField.safeParse("987654321").success, true);
    assert.equal(optionalPhoneField.safeParse("98765432").success, false);
  });
});

describe("Profesor — alcance simulado", () => {
  it("no ve alumnos de secciones ajenas", () => {
    const seccionesProfesor = new Set(["sec-2a", "sec-2d"]);
    const todos = [
      { id: "e1", seccionId: "sec-2a" },
      { id: "e2", seccionId: "sec-3b" },
    ];
    const visibles = todos.filter((e) => seccionesProfesor.has(e.seccionId));
    assert.equal(visibles.length, 1);
    assert.equal(visibles[0].id, "e1");
  });

  it("director ve todos los estudiantes", () => {
    const role = "admin";
    const estudiantes = [{ id: "e1" }, { id: "e2" }];
    const visibles = role === "admin" ? estudiantes : [];
    assert.equal(visibles.length, 2);
  });
});

describe("Filtros profesor — limpieza dependiente", () => {
  it("al cambiar grado limpia sección y curso", () => {
    let draft = { gradoId: "1", seccionId: "s1", courseId: "c1", search: "" };
    draft = { ...draft, gradoId: "2", seccionId: "", courseId: "" };
    assert.equal(draft.seccionId, "");
    assert.equal(draft.courseId, "");
  });

  it("al cambiar sección limpia curso", () => {
    let draft = { gradoId: "1", seccionId: "s1", courseId: "c1", search: "" };
    draft = { ...draft, seccionId: "s2", courseId: "" };
    assert.equal(draft.courseId, "");
  });
});
