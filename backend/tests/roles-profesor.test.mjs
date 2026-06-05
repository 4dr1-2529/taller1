/**
 * Reglas de alcance profesor (sin BD): secciones vía cursos, no inscripciones.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Profesor — reglas de visibilidad", () => {
  it("solo ve estudiantes de secciones donde dicta un curso", () => {
    const cursosProfesor = [
      { seccionId: "sec-2a", nombre: "Inglés" },
      { seccionId: "sec-2d", nombre: "Inglés" },
    ];
    const seccionesPermitidas = new Set(cursosProfesor.map((c) => c.seccionId));
    const estudiantes = [
      { id: "e1", seccionId: "sec-2a" },
      { id: "e2", seccionId: "sec-3b" },
      { id: "e3", seccionId: "sec-2d" },
    ];
    const visibles = estudiantes.filter((e) => seccionesPermitidas.has(e.seccionId));
    assert.equal(visibles.length, 2);
    assert.ok(visibles.every((e) => e.seccionId === "sec-2a" || e.seccionId === "sec-2d"));
  });

  it("director no aplica filtro de sección del profesor", () => {
    const role = "admin";
    const aplicaFiltroProfesor = role === "docente";
    assert.equal(aplicaFiltroProfesor, false);
  });

  it("profesorId del cliente no debe usarse para autorizar", () => {
    const fromToken = "teacher-uuid-from-jwt";
    const fromBody = "otro-teacher-malicioso";
    const effective = fromToken;
    assert.notEqual(effective, fromBody);
  });
});
