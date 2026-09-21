import assert from "node:assert/strict";
import { test } from "node:test";
import { validateStudentForm, validateTeacherForm, validatePassword } from "../src/lib/validation";
import { attachPredictions, averageGrade, globalRiskScore, lowLmsStudents } from "../src/lib/aggregates";
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
test("password rule matches backend: 8 + upper + lower + digit, no symbol required", () => {
  assert.equal(validatePassword("Password1x"), undefined);
  assert.ok(validatePassword("short1A"));
  assert.ok(validatePassword("password1x"));
  assert.ok(validatePassword("PASSWORD1X"));
  assert.ok(validatePassword("Passwordxx"));
  assert.deepEqual(validateTeacherForm({ dni: "12345678", nombres: "Ana", apellidos: "Quispe", especialidad: "Matemática", correo: "ana@example.test", telefono: "", crearCuenta: true, password: "weak" }).password !== undefined, true);
});
function blankStudent(id: string): Student {
  return {
    id, codigo: `EST-${id}`, nombres: "A", apellidos: "B", nivel: "1A",
    correo: "", telefono: "", estado: "activo",
    metrics: {
      promedioGeneral: 14, asistenciaGeneral: 90,
      lms: { engagement: "bajo", actividadSemanalPct: [10], minutosPorSemana: [30], actividadesRealizadas: 1, recursosConsultados: 1, horasPlataformaSemana: 0.5 },
    },
  } as unknown as Student;
}
test("risk score is null without predictions, never zero-as-data", () => {
  assert.equal(globalRiskScore([]), null);
  assert.equal(globalRiskScore([blankStudent("1")]), null);
  assert.equal(averageGrade([]), null);
  assert.equal(averageGrade([blankStudent("1"), blankStudent("2")]), 14);
});
test("low LMS list does not require predictions", () => {
  assert.equal(lowLmsStudents([blankStudent("1"), blankStudent("2")]).length, 2);
});
