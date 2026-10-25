import test from "node:test";
import assert from "node:assert/strict";
import {
  personNameField,
  codigoField,
  optionalDniField,
  optionalPhoneField,
  observacionField,
  gradeField,
  percentageField,
  securePasswordField,
  roleCodeField,
  optionalEmailField,
} from "../../src/validators/fields.js";

async function validate(schema, value) {
  return schema.safeParse(value);
}

test("personNameField acepta nombres válidos", async () => {
  const r = await validate(personNameField, "Juan Pérez");
  assert.ok(r.success);
});

test("personNameField rechaza nombres cortos", async () => {
  const r = await validate(personNameField, "A");
  assert.ok(!r.success);
});

test("personNameField rechaza caracteres no permitidos", async () => {
  const r = await validate(personNameField, "Juan123");
  assert.ok(!r.success);
});

test("codigoField acepta códigos válidos", async () => {
  const r = await validate(codigoField, "MAT-101");
  assert.ok(r.success);
  const r2 = await validate(codigoField, "COD_1");
  assert.ok(r2.success);
});

test("codigoField rechaza caracteres especiales", async () => {
  const r = await validate(codigoField, "MAT@101");
  assert.ok(!r.success);
});

test("optionalDniField acepta undefined", async () => {
  const r = await validate(optionalDniField, undefined);
  assert.ok(r.success);
});

test("optionalDniField acepta DNI válido", async () => {
  const r = await validate(optionalDniField, "12345678");
  assert.ok(r.success);
});

test("optionalDniField rechaza DNI inválido", async () => {
  const r = await validate(optionalDniField, "123");
  assert.ok(!r.success);
});

test("optionalPhoneField acepta teléfono válido", async () => {
  const r = await validate(optionalPhoneField, "987654321");
  assert.ok(r.success);
});

test("optionalPhoneField rechaza teléfono corto", async () => {
  const r = await validate(optionalPhoneField, "1234567");
  assert.ok(!r.success);
});

test("observacionField acepta texto vacío", async () => {
  const r = await validate(observacionField, undefined);
  assert.ok(r.success);
});

test("observacionField rechaza texto muy largo", async () => {
  const r = await validate(observacionField, "a".repeat(501));
  assert.ok(!r.success);
});

test("gradeField acepta nota 0-20", async () => {
  const r = await validate(gradeField, 15);
  assert.ok(r.success);
  assert.strictEqual(r.data, 15);
});

test("gradeField rechaza nota fuera de rango", async () => {
  const r = await validate(gradeField, 21);
  assert.ok(!r.success);
  const r2 = await validate(gradeField, -1);
  assert.ok(!r2.success);
});

test("percentageField acepta porcentaje 0-100", async () => {
  const r = await validate(percentageField, 85);
  assert.ok(r.success);
});

test("percentageField rechaza > 100", async () => {
  const r = await validate(percentageField, 101);
  assert.ok(!r.success);
});

test("securePasswordField acepta contraseña válida", async () => {
  const r = await validate(securePasswordField, "Clave123");
  assert.ok(r.success);
});

test("securePasswordField rechaza sin mayúscula", async () => {
  const r = await validate(securePasswordField, "clave123");
  assert.ok(!r.success);
});

test("securePasswordField rechaza sin número", async () => {
  const r = await validate(securePasswordField, "Claveabc");
  assert.ok(!r.success);
});

test("securePasswordField rechaza muy corta", async () => {
  const r = await validate(securePasswordField, "Ab1");
  assert.ok(!r.success);
});

test("roleCodeField acepta roles válidos", async () => {
  for (const role of ["admin", "docente", "estudiante"]) {
    const r = await validate(roleCodeField, role);
    assert.ok(r.success, `rol ${role} debe ser válido`);
  }
});

test("roleCodeField rechaza rol inválido", async () => {
  const r = await validate(roleCodeField, "invitado");
  assert.ok(!r.success);
});

test("optionalEmailField acepta email válido", async () => {
  const r = await validate(optionalEmailField, "usuario@dominio.com");
  assert.ok(r.success);
});

test("optionalEmailField acepta vacío", async () => {
  const r = await validate(optionalEmailField, "");
  assert.ok(r.success);
});

test("optionalEmailField rechaza email inválido", async () => {
  const r = await validate(optionalEmailField, "no-email");
  assert.ok(!r.success);
});
