/**
 * Validaciones centralizadas (Zod) — importa schemas reales del backend
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  loginSchema,
  studentSchema,
  gradeSchema,
  attendanceSchema,
  predictSchema,
  alertStatusSchema,
  courseSchema,
  teacherSchema,
  createUserSchema,
  changePasswordSchema,
} from "../src/validators/schemas.js";

describe("AUTH", () => {
  it("login válido", () => {
    assert.equal(
      loginSchema.safeParse({ email: "dir@blenkir.edu.pe", password: "mbappe29" }).success,
      true,
    );
  });
  it("login inválido — email", () => {
    assert.equal(loginSchema.safeParse({ email: "x", password: "123456" }).success, false);
  });
});

describe("Estudiantes", () => {
  it("crear estudiante con campos obligatorios", () => {
    const r = studentSchema.safeParse({
      codigo: "EST-001",
      nombres: "Juan",
      apellidos: "Pérez",
      seccionId: "1",
    });
    assert.equal(r.success, true);
  });
  it("nota fuera de rango", () => {
    assert.equal(gradeSchema.safeParse({ studentId: "1", courseId: "2", nota: 25 }).success, false);
  });
});

describe("Predicción y alertas", () => {
  it("predict requiere studentId o metrics", () => {
    assert.equal(predictSchema.safeParse({}).success, false);
    assert.equal(predictSchema.safeParse({ studentId: "abc" }).success, true);
  });
  it("estado de alerta válido", () => {
    assert.equal(alertStatusSchema.safeParse({ status: "nueva" }).success, true);
    assert.equal(alertStatusSchema.safeParse({ status: "cerrada" }).success, false);
  });
});

describe("Roles y contraseña", () => {
  it("createUser solo roles permitidos", () => {
    assert.equal(
      createUserSchema.safeParse({
        email: "p@b.com",
        password: "Password1x",
        nombres: "Ana",
        apellidos: "López",
        role: "docente",
      }).success,
      true,
    );
    assert.equal(
      createUserSchema.safeParse({
        email: "p@b.com",
        password: "Password1x",
        nombres: "Ana",
        apellidos: "López",
        role: "tutor",
      }).success,
      false,
    );
  });
  it("changePassword exige contraseña segura", () => {
    assert.equal(
      changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "weak" }).success,
      false,
    );
  });
});

describe("Cursos y asistencia", () => {
  it("curso con nombre y sección", () => {
    assert.equal(
      courseSchema.safeParse({
        codigo: "MAT-01",
        nombre: "Matemática",
        profesorId: "1",
        seccionId: "2",
      }).success,
      true,
    );
  });
  it("asistencia con fecha", () => {
    assert.equal(
      attendanceSchema.safeParse({ studentId: "1", fecha: "2026-06-01" }).success,
      true,
    );
  });
  it("profesor con email válido", () => {
    assert.equal(
      teacherSchema.safeParse({
        codigo: "DOC-01",
        nombres: "María",
        apellidos: "García",
        especialidad: "Matemáticas",
        correo: "maria@blenkir.edu.pe",
      }).success,
      true,
    );
  });
});
