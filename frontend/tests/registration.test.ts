import assert from "node:assert/strict";
import { test } from "node:test";
import { validateStudentForm, validateTeacherForm, validatePassword } from "../src/lib/validation";
import { attachPredictions, averageAttendance, averageGrade, globalRiskScore, lowLmsStudents, studentsInCourseSalon } from "../src/lib/aggregates";
import { mapStudentFromApi } from "../src/lib/api-mappers";
import { formatContributionPoints } from "../src/lib/prediction-display";
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
    id, codigo: `EST-${id}`, dni: "12345678", nombres: "A", apellidos: "B", nivel: "1A",
    correo: "", telefono: "", estado: "activo", hasGrades: true, hasAttendance: true,
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
test("mapper distingue sin-datos de cero real", () => {
  const base = { id: "1", codigo: "EST-001", nombres: "A", apellidos: "B", dni: "12345678", correo: "", telefono: "", estado: "activo", promedioGeneral: 0, asistenciaGeneral: 0 };
  const sinDatos = mapStudentFromApi({ ...base, indicators: { promedio_general: null, asistencia_general: null, dias_activos: 0, actividades_realizadas: 0, recursos_consultados: 0, tiempo_interaccion_lms: 0 } });
  assert.equal(sinDatos.hasGrades, false);
  assert.equal(sinDatos.hasAttendance, false);
  const ceroReal = mapStudentFromApi({ ...base, indicators: { promedio_general: 0, asistencia_general: 0, dias_activos: 1, actividades_realizadas: 0, recursos_consultados: 0, tiempo_interaccion_lms: 0 } });
  assert.equal(ceroReal.hasGrades, true);
  assert.equal(ceroReal.hasAttendance, true);
  assert.equal(ceroReal.metrics.promedioGeneral, 0);
  assert.equal(averageGrade([sinDatos]), null);
  assert.equal(averageGrade([sinDatos, ceroReal]), 0);
  assert.equal(averageAttendance([sinDatos]), null);
  assert.equal(averageAttendance([sinDatos, ceroReal]), 0);
});
test("prediction contribution is displayed as points without percentage scaling", () => {
  assert.equal(formatContributionPoints(16), "16 pts");
  assert.equal(formatContributionPoints(16.4), "16 pts");
});
test("teacher report rows follow active course enrollment instead of section alone", () => {
  const enrolled = { ...blankStudent("1"), seccionId: "section-a", enrolledCourseIds: ["course-a"] };
  const outside = { ...blankStudent("2"), seccionId: "section-a", enrolledCourseIds: ["course-b"] };
  const course = { id: "course-a", codigo: "MAT-1A", nombre: "Matematica", nivel: "1A", profesorId: "teacher-1", seccionId: "section-a" };
  assert.deepEqual(studentsInCourseSalon([enrolled, outside], course).map((student) => student.id), ["1"]);
});
