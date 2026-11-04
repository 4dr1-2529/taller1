import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStudentAccountEmail,
  buildTeacherAccountEmail,
} from "../../src/utils/person-accounts.js";

test("buildStudentAccountEmail usa el correo explícito cuando existe", () => {
  assert.strictEqual(
    buildStudentAccountEmail("Juan", "Pérez", "12345678", "  Juan@COLLEGE.edu.pe "),
    "juan@college.edu.pe",
  );
});

test("buildStudentAccountEmail genera slug a partir del nombre y apellido", () => {
  assert.strictEqual(
    buildStudentAccountEmail("María José", "García López", "12345678"),
    "mariajose.garcia5678@blenkir.edu.pe",
  );
});

test("buildStudentAccountEmail soporta nombres con acentos", () => {
  assert.strictEqual(
    buildStudentAccountEmail("Jaime", "Nuñez", "00000001"),
    "jaime.nunez0001@blenkir.edu.pe",
  );
});

test("buildStudentAccountEmail usa los últimos cuatro dígitos del DNI", () => {
  assert.strictEqual(
    buildStudentAccountEmail("Ana", "López", "87654321"),
    "ana.lopez4321@blenkir.edu.pe",
  );
});

test("buildTeacherAccountEmail usa el formato pro{DNI}", () => {
  assert.strictEqual(buildTeacherAccountEmail("12345678"), "pro12345678@blenkir.edu.pe");
});
