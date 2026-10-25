import test from "node:test";
import assert from "node:assert/strict";
import {
  loginSchema,
  studentSchema,
  gradeSchema,
  teacherSchema,
  courseSchema,
  seccionSchema,
  matriculaSchema,
} from "../../src/validators/schemas.js";

async function validate(schema, value) {
  return schema.safeParse(value);
}

test("loginSchema acepta credenciales válidas", async () => {
  const r = await validate(loginSchema, { email: "Usuario@Dominio.Com", password: "Clave123" });
  assert.ok(r.success);
  assert.strictEqual(r.data.email, "usuario@dominio.com");
});

test("loginSchema rechaza email inválido", async () => {
  const r = await validate(loginSchema, { email: "no-email", password: "Clave123" });
  assert.ok(!r.success);
});

test("loginSchema rechaza contraseña muy corta", async () => {
  const r = await validate(loginSchema, { email: "a@b.com", password: "Ab1" });
  assert.ok(!r.success);
});

test("studentSchema acepta estudiante válido", async () => {
  const r = await validate(studentSchema, {
    nombres: "Juan Pérez",
    apellidos: "García López",
    seccionId: "1",
    dni: "12345678",
    correo: "juan@test.com",
    telefono: "987654321",
  });
  assert.ok(r.success);
});

test("studentSchema rechaza DNI inválido", async () => {
  const r = await validate(studentSchema, {
    nombres: "Juan Pérez",
    apellidos: "García López",
    seccionId: "1",
    dni: "123",
    correo: "juan@test.com",
  });
  assert.ok(!r.success);
});

test("studentSchema rechaza seccionId inválido", async () => {
  const r = await validate(studentSchema, {
    nombres: "Juan Pérez",
    apellidos: "García López",
    seccionId: "abc",
    dni: "12345678",
  });
  assert.ok(!r.success);
});

test("gradeSchema acepta nota válida", async () => {
  const r = await validate(gradeSchema, {
    studentId: "1",
    courseId: "2",
    nota: 15.5,
  });
  assert.ok(r.success);
});

test("gradeSchema rechaza nota fuera de rango", async () => {
  const r = await validate(gradeSchema, {
    studentId: "1",
    courseId: "2",
    nota: 25,
  });
  assert.ok(!r.success);
});

test("teacherSchema acepta docente válido", async () => {
  const r = await validate(teacherSchema, {
    dni: "12345678",
    nombres: "Ana",
    apellidos: "Gómez",
    especialidad: "Matemáticas",
    correo: "ana@test.com",
    crearCuenta: true,
    password: "Clave123",
  });
  assert.ok(r.success);
});

test("teacherSchema rechaza crearCuenta sin password", async () => {
  const r = await validate(teacherSchema, {
    dni: "12345678",
    nombres: "Ana",
    apellidos: "Gómez",
    especialidad: "Matemáticas",
    correo: "ana@test.com",
    crearCuenta: true,
  });
  assert.ok(!r.success);
});

test("courseSchema acepta curso válido", async () => {
  const r = await validate(courseSchema, {
    codigo: "MAT-101",
    nombre: "Matemáticas",
    profesorId: "1",
    seccionId: "2",
  });
  assert.ok(r.success);
});

test("seccionSchema acepta sección válida", async () => {
  const r = await validate(seccionSchema, {
    nombre: "A",
    gradoId: 1,
    capacidad: 30,
  });
  assert.ok(r.success);
});

test("matriculaSchema acepta matrícula válida", async () => {
  const r = await validate(matriculaSchema, {
    estudianteId: "1",
    seccionId: "2",
    anioLectivoId: "3",
  });
  assert.ok(r.success);
});
