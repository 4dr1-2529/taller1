/**
 * Pruebas de reglas de alcance por rol (lógica documentada)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const PERMISOS = {
  admin: ["gestionar_todo", "comunicados", "reportes"],
  docente: ["mis_cursos", "notas", "asistencia", "lms", "prediccion", "alertas_propias"],
  estudiante: ["mis_notas", "mi_riesgo", "mensajes_lectura"],
};

function puede(accion, rol) {
  return PERMISOS[rol]?.includes(accion) ?? false;
}

describe("Permisos permitidos", () => {
  it("director gestiona profesores", () => {
    assert.equal(puede("gestionar_todo", "admin"), true);
  });
  it("profesor predicción", () => {
    assert.equal(puede("prediccion", "docente"), true);
  });
  it("estudiante ve riesgo", () => {
    assert.equal(puede("mi_riesgo", "estudiante"), true);
  });
});

describe("Permisos prohibidos", () => {
  it("estudiante no gestiona", () => {
    assert.equal(puede("gestionar_todo", "estudiante"), false);
  });
  it("profesor no comunicados globales", () => {
    assert.equal(puede("comunicados", "docente"), false);
  });
});
