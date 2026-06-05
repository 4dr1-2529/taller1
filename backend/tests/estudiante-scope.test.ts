import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../src/middleware/errorHandler.js";
import { rejectClientStudentId } from "../src/utils/estudiante-scope.js";
import { notaEstadoLabel } from "../src/utils/grade-status.js";

describe("Estudiante — alcance y seguridad", () => {
  it("rechaza studentId del cliente distinto al del token", () => {
    assert.throws(
      () => rejectClientStudentId("999", BigInt(1)),
      (e: unknown) => e instanceof AppError && e.message.includes("No tiene permiso"),
    );
  });

  it("permite petición sin studentId en query", () => {
    assert.doesNotThrow(() => rejectClientStudentId(undefined, BigInt(1)));
  });

  it("permite studentId coincidente con el token", () => {
    assert.doesNotThrow(() => rejectClientStudentId("1", BigInt(1)));
  });
});

describe("Estudiante — estado de notas", () => {
  it("clasifica aprobado, en riesgo y desaprobado", () => {
    assert.equal(notaEstadoLabel(16), "Aprobado");
    assert.equal(notaEstadoLabel(12), "En riesgo");
    assert.equal(notaEstadoLabel(9), "Desaprobado");
  });
});
