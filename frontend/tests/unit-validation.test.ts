import test from "node:test";
import assert from "node:assert/strict";
import {
  onlyDigits,
  sanitizeGradeInput,
  sanitizePercentInput,
  sanitizeObservacion,
  sanitizeNonNegativeInt,
  sanitizeNonNegativeDecimal,
  sanitizePersonName,
  sanitizeCodigo,
  validatePersonName,
  validateCodigo,
  validateDni,
  validatePhone,
  validateEmail,
  validateGradeString,
  validatePercentString,
  validateObservacion,
  validateNonNegativeIntString,
  parseGrade,
  parsePercent,
  clearFieldError,
  validatePassword,
  validateStudentForm,
  validateTeacherForm,
  validateTeacherProfileFields,
  validateGradeForm,
  validateCourseForm,
  validateMatriculaForm,
  firstError,
} from "../src/lib/validation.js";

test("onlyDigits extrae solo dígitos", () => {
  assert.strictEqual(onlyDigits("abc123def"), "123");
});

test("onlyDigits respeta maxLen", () => {
  assert.strictEqual(onlyDigits("123456789", 3), "123");
});

test("sanitizeGradeInput convierte coma a punto", () => {
  assert.strictEqual(sanitizeGradeInput("15,5"), "15.5");
});

test("sanitizeGradeInput elimina caracteres no numéricos", () => {
  assert.strictEqual(sanitizeGradeInput("15a.5b"), "15.5");
});

test("sanitizeGradeInput limita a un decimal", () => {
  assert.strictEqual(sanitizeGradeInput("15.56"), "15.5");
});

test("sanitizeGradeInput limita a 20", () => {
  assert.strictEqual(sanitizeGradeInput("25"), "20");
});

test("sanitizePercentInput convierte coma a punto", () => {
  assert.strictEqual(sanitizePercentInput("85,5"), "85.5");
});

test("sanitizePercentInput limita a 100", () => {
  assert.strictEqual(sanitizePercentInput("150"), "100");
});

test("sanitizeObservacion elimina números", () => {
  assert.strictEqual(sanitizeObservacion("hola 123 mundo"), "hola  mundo");
});

test("sanitizeObservacion respeta maxLen", () => {
  assert.strictEqual(sanitizeObservacion("hola mundo", 5), "hola ");
});

test("sanitizeNonNegativeInt extrae dígitos", () => {
  assert.strictEqual(sanitizeNonNegativeInt("abc123def"), "123");
});

test("sanitizeNonNegativeDecimal elimina caracteres no numéricos", () => {
  assert.strictEqual(sanitizeNonNegativeDecimal("12.34ab"), "12.34");
});

test("sanitizePersonName elimina caracteres no letras", () => {
  assert.strictEqual(sanitizePersonName("Juan123"), "Juan");
});

test("sanitizeCodigo elimina caracteres no alfanuméricos", () => {
  assert.strictEqual(sanitizeCodigo("MAT@101!"), "MAT101");
});

test("validatePersonName acepta nombre válido", () => {
  assert.strictEqual(validatePersonName("Juan Pérez", "Nombres"), undefined);
});

test("validatePersonName rechaza vacío", () => {
  assert.strictEqual(validatePersonName("", "Nombres"), "Este campo es obligatorio.");
});

test("validatePersonName rechaza muy corto", () => {
  assert.strictEqual(validatePersonName("A", "Nombres"), "Mínimo 2 caracteres.");
});

test("validatePersonName rechaza no letras", () => {
  assert.strictEqual(validatePersonName("Juan123", "Nombres"), "Solo se permiten letras.");
});

test("validateCodigo acepta código válido", () => {
  assert.strictEqual(validateCodigo("MAT-101"), undefined);
});

test("validateCodigo rechaza código vacío", () => {
  assert.strictEqual(validateCodigo(""), "Este campo es obligatorio.");
});

test("validateDni acepta DNI de 8 dígitos", () => {
  assert.strictEqual(validateDni("12345678"), undefined);
});

test("validateDni rechaza DNI corto", () => {
  assert.strictEqual(validateDni("123"), "DNI debe tener 8 dígitos.");
});

test("validatePhone acepta teléfono de 9 dígitos", () => {
  assert.strictEqual(validatePhone("987654321"), undefined);
});

test("validatePhone rechaza teléfono corto", () => {
  assert.strictEqual(validatePhone("1234567"), "Teléfono debe tener 9 dígitos.");
});

test("validateEmail acepta email válido", () => {
  assert.strictEqual(validateEmail("usuario@dominio.com"), undefined);
});

test("validateEmail rechaza email inválido", () => {
  assert.strictEqual(validateEmail("no-email"), "Correo electrónico inválido.");
});

test("validateGradeString acepta nota válida", () => {
  assert.strictEqual(validateGradeString("15"), undefined);
});

test("validateGradeString rechaza nota fuera de rango", () => {
  assert.strictEqual(validateGradeString("25"), "La nota debe estar entre 0 y 20.");
});

test("validatePercentString acepta porcentaje válido", () => {
  assert.strictEqual(validatePercentString("85"), undefined);
});

test("validatePercentString rechaza > 100", () => {
  assert.strictEqual(validatePercentString("150"), "La asistencia debe estar entre 0 y 100.");
});

test("validateObservacion acepta observación válida", () => {
  assert.strictEqual(validateObservacion("texto válido"), undefined);
});

test("validateObservacion rechaza con números", () => {
  assert.strictEqual(validateObservacion("texto 123"), "Solo se permiten letras.");
});

test("validateNonNegativeIntString acepta entero válido", () => {
  assert.strictEqual(validateNonNegativeIntString("123"), undefined);
});

test("validateNonNegativeIntString rechaza no entero", () => {
  assert.strictEqual(validateNonNegativeIntString("abc"), "Solo se permiten números.");
});

test("parseGrade devuelve número", () => {
  assert.strictEqual(parseGrade("15.5"), 15.5);
});

test("parseGrade devuelve null para inválido", () => {
  assert.strictEqual(parseGrade("abc"), null);
});

test("parsePercent devuelve número", () => {
  assert.strictEqual(parsePercent("85.5"), 85.5);
});

test("clearFieldError elimina clave", () => {
  const errors = { email: "inválido", dni: "corto" };
  const result = clearFieldError(errors, "email");
  assert.deepStrictEqual(result, { dni: "corto" });
  assert.ok(!("email" in result));
});

test("validation cubre campos opcionales, formularios completos y límites válidos", () => {
  assert.equal(validatePersonName("  ", "Segundo nombre", false), undefined);
  assert.equal(validateCodigo("  ", false), undefined);
  assert.equal(validateDni("", false), undefined);
  assert.equal(validatePhone("", false), undefined);
  assert.equal(validateEmail("", false), undefined);
  assert.equal(validateGradeString("", false), undefined);
  assert.equal(validatePercentString("", false), undefined);
  assert.equal(validateObservacion("", false), undefined);
  assert.equal(validateObservacion("", true), "Este campo es obligatorio.");
  assert.equal(validateGradeString("0"), undefined);
  assert.equal(validateGradeString("20,0"), undefined);
  assert.equal(validatePercentString("0"), undefined);
  assert.equal(validatePercentString("100,0"), undefined);
  assert.equal(validatePassword("ValidPass1"), undefined);

  assert.deepEqual(validateStudentForm({
    nombres: "Ana", apellidos: "Paz", seccionId: "sec1", dni: "12345678", correo: "", telefono: "",
  }), {});
  assert.ok(Object.keys(validateStudentForm({
    nombres: "", apellidos: "1", seccionId: " ", dni: "bad", correo: "bad", telefono: "bad",
  })).length >= 5);

  assert.deepEqual(validateTeacherProfileFields({
    nombres: "Ana", apellidos: "Paz", especialidad: "Ciencias", correo: "ana@example.test", telefono: "",
  }), {});
  assert.deepEqual(validateTeacherForm({
    dni: "12345678", nombres: "Ana", apellidos: "Paz", especialidad: "Ciencias",
    correo: "ana@example.test", telefono: "", crearCuenta: false, password: "",
  }), {});
  assert.ok(validateTeacherForm({
    dni: "12345678", nombres: "Ana", apellidos: "Paz", especialidad: "Ciencias",
    correo: "ana@example.test", telefono: "", crearCuenta: true, password: "weak",
  }).password);

  assert.deepEqual(validateGradeForm({ studentId: "s1", courseId: "c1", nota: "20", observacion: "" }), {});
  assert.deepEqual(validateGradeForm({ studentId: "", courseId: "", nota: "-1", observacion: "nota 2" }).studentId, "Este campo es obligatorio.");
  assert.deepEqual(validateCourseForm({ codigo: "MAT-1", nombre: "Matemática", profesorId: "t1", gradoId: "g1", seccionId: "s1" }), {});
  assert.deepEqual(validateMatriculaForm({ estudianteId: "s1", seccionId: "s1", anioLectivoId: "2026" }), {});
  assert.equal(firstError({}), undefined);
  assert.equal(firstError({ correo: "inválido", dni: "corto" }), "inválido");
});
