/**
 * Matriz de permisos por rol (Director / Profesor / Estudiante)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const PERMISOS = {
  admin: {
    crearEstudiante: true,
    crearProfesor: true,
    predecirCualquiera: true,
    verTodosAlertas: true,
    eliminarAsistencia: true,
  },
  docente: {
    crearEstudiante: false,
    crearProfesor: false,
    predecirSusEstudiantes: true,
    verTodosAlertas: false,
    eliminarAsistencia: false,
  },
  estudiante: {
    crearEstudiante: false,
    verPropioRiesgo: true,
    predecirOtros: false,
    registrarNota: false,
  },
};

function puede(rol, accion) {
  return Boolean(PERMISOS[rol]?.[accion]);
}

describe("Permisos DIRECTOR (admin)", () => {
  it("acceso total gestión", () => {
    assert.equal(puede("admin", "crearEstudiante"), true);
    assert.equal(puede("admin", "crearProfesor"), true);
  });
});

describe("Permisos PROFESOR (docente)", () => {
  it("no crea estudiantes ni profesores", () => {
    assert.equal(puede("docente", "crearEstudiante"), false);
    assert.equal(puede("docente", "crearProfesor"), false);
  });
  it("puede predecir en su ámbito", () => {
    assert.equal(puede("docente", "predecirSusEstudiantes"), true);
  });
  it("bloqueo acceso no autorizado — eliminar asistencia global", () => {
    assert.equal(puede("docente", "eliminarAsistencia"), false);
  });
});

describe("Permisos ESTUDIANTE", () => {
  it("solo información propia", () => {
    assert.equal(puede("estudiante", "verPropioRiesgo"), true);
    assert.equal(puede("estudiante", "predecirOtros"), false);
    assert.equal(puede("estudiante", "registrarNota"), false);
  });
});

describe("Roles válidos del sistema", () => {
  it("solo 3 roles", () => {
    assert.deepEqual(Object.keys(PERMISOS).sort(), ["admin", "docente", "estudiante"]);
  });
});
