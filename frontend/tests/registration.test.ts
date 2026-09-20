import assert from "node:assert/strict";
import { test } from "node:test";
import { validateStudentForm, validateTeacherForm } from "../src/lib/validation";
import { attachPredictions } from "../src/lib/aggregates";
import type { Student } from "../src/types/academic";

test("student registration accepts only identification and section, with optional contacts", () => {
  assert.deepEqual(validateStudentForm({ dni: "12345678", nombres: "Ana", apellidos: "Quispe", seccionId: "1", correo: "", telefono: "" }), {});
});
test("student form rejects invalid DNI, phone, email and missing section", () => {
  const errors = validateStudentForm({ dni: "123", nombres: "Ana", apellidos: "Quispe", seccionId: "", correo: "incorrecto", telefono: "987" });
  for (const key of ["dni", "seccionId", "correo", "telefono"]) assert.ok(errors[key]);
});
test("teacher registration requires no manual code or course assignment", () => {
  assert.deepEqual(validateTeacherForm({ dni: "12345678", nombres: "Ana", apellidos: "Quispe", especialidad: "Matemática", correo: "ana@example.test", telefono: "", crearCuenta: false, password: "" }), {});
});
test("unpredicted students never receive a fabricated risk", () => {
  assert.deepEqual(attachPredictions([{ id: "1" } as Student]), []);
});
