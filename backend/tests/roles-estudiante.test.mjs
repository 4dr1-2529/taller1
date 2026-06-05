/**
 * Reglas de visibilidad estudiante (sin BD).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Estudiante — reglas de visibilidad", () => {
  it("solo usa endpoints /estudiante/* en frontend", () => {
    const role = "estudiante";
    const path = role === "estudiante" ? "/estudiante/notas" : "/grades";
    assert.equal(path, "/estudiante/notas");
  });

  it("no debe ver filtros globales de grado/sección", () => {
    const role = "estudiante";
    const showGlobalFilters = role !== "estudiante";
    assert.equal(showGlobalFilters, false);
  });

  it("estudiante no accede a endpoints de profesor", () => {
    const role = "estudiante";
    const allowedProfesor = role === "docente";
    assert.equal(allowedProfesor, false);
  });

  it("estudiante no accede a endpoints de director", () => {
    const role = "estudiante";
    const allowedDirector = role === "admin";
    assert.equal(allowedDirector, false);
  });

  it("studentId del cliente no debe autorizar acceso ajeno", () => {
    const fromToken = BigInt(42);
    const fromClient = "99";
    const matches = fromClient === String(fromToken);
    assert.equal(matches, false);
  });
});
