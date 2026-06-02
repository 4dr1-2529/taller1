/**
 * Pruebas unitarias de validación (Zod) — preparación SonarQube
 * node --test backend/tests/validators.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const gradeField = z.coerce.number().min(0).max(20);
const percentageField = z.coerce.number().min(0).max(100);

describe("AUTH validación", () => {
  it("login válido", () => {
    const r = loginSchema.safeParse({ email: "a@b.com", password: "123456" });
    assert.equal(r.success, true);
  });
  it("login inválido — email", () => {
    const r = loginSchema.safeParse({ email: "bad", password: "123456" });
    assert.equal(r.success, false);
  });
});

describe("Rangos académicos", () => {
  it("promedio 0-20", () => {
    assert.equal(gradeField.safeParse(15).success, true);
    assert.equal(gradeField.safeParse(21).success, false);
  });
  it("asistencia 0-100", () => {
    assert.equal(percentageField.safeParse(80).success, true);
    assert.equal(percentageField.safeParse(101).success, false);
  });
});

describe("Roles válidos", () => {
  const roleSchema = z.enum(["admin", "docente", "estudiante"]);
  it("solo 3 roles", () => {
    assert.equal(roleSchema.safeParse("admin").success, true);
    assert.equal(roleSchema.safeParse("tutor").success, false);
  });
});
