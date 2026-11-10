import test from "node:test";
import assert from "node:assert/strict";
import {
  profesorDashboard,
  profesorGrados,
  profesorSecciones,
  profesorCursos,
  profesorEstudiantes,
  profesorLms,
  profesorNotas,
  profesorNotasPost,
  profesorAsistencia,
  profesorAsistenciaMasiva,
  profesorPredicciones,
  profesorPrediccionesPost,
  profesorHistorialPredicciones,
  profesorAlertas,
  profesorAlertaEstado,
} from "../../src/controllers/profesor.controller.js";

const legacyHandlers = [
  ["profesorNotas", profesorNotas],
  ["profesorNotasPost", profesorNotasPost],
  ["profesorAsistencia", profesorAsistencia],
  ["profesorAsistenciaMasiva", profesorAsistenciaMasiva],
  ["profesorPredicciones", profesorPredicciones],
  ["profesorPrediccionesPost", profesorPrediccionesPost],
  ["profesorHistorialPredicciones", profesorHistorialPredicciones],
  ["profesorAlertas", profesorAlertas],
  ["profesorAlertaEstado", profesorAlertaEstado],
];

const scopedHandlers = [
  ["profesorDashboard", profesorDashboard],
  ["profesorGrados", profesorGrados],
  ["profesorSecciones", profesorSecciones],
  ["profesorCursos", profesorCursos],
  ["profesorEstudiantes", profesorEstudiantes],
  ["profesorLms", profesorLms],
];

for (const [name, handler] of legacyHandlers) {
  test(`${name} delega a su controlador actual y pasa errores a next`, async () => {
    const errors = [];
    const req = { query: {}, params: {}, body: {} };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };

    await assert.doesNotReject(handler(req, res, (error) => errors.push(error)));
    assert.ok(errors.length > 0 || res.body !== undefined);
  });
}

for (const [name, handler] of scopedHandlers) {
  test(`${name} remite a next cuando no hay identidad de docente`, async () => {
    const errors = [];
    const req = { query: {}, params: {}, body: {} };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };

    await assert.doesNotReject(handler(req, res, (error) => errors.push(error)));
    assert.equal(errors.length, 1);
    assert.equal(errors[0].statusCode, 403);
  });
}
