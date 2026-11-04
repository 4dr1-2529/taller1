import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeBody } from "../../src/middleware/sanitize.js";

test("sanitizeBody neutraliza HTML en valores de cadena", () => {
  const req = { body: { nombre: "<script>alert(1)</script>Juan" } };
  let nextCalled = false;
  sanitizeBody(req, {}, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  assert.notStrictEqual(req.body.nombre, "<script>alert(1)</script>Juan");
});

test("sanitizeBody limpia arreglos y objetos anidados", () => {
  const req = {
    body: {
      etiquetas: ["<iframe src=\"x\"></iframe>"],
      anidado: { observacion: "<svg onload=alert(1)>" },
      numero: 7,
    },
  };
  sanitizeBody(req, {}, () => {});
  assert.notStrictEqual(req.body.etiquetas[0], "<iframe src=\"x\"></iframe>");
  assert.notStrictEqual(req.body.anidado.observacion, "<svg onload=alert(1)>");
  assert.strictEqual(req.body.numero, 7);
});

test("sanitizeBody no rompe cuando no hay cuerpo", () => {
  const req = {};
  let nextCalled = false;
  sanitizeBody(req, {}, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.body, undefined);
});

test("sanitizeBody deja valores no cadenas intactos", () => {
  const req = { body: { activo: true, cuenta: null, lista: [1, 2, 3] } };
  sanitizeBody(req, {}, () => {});
  assert.deepStrictEqual(req.body, { activo: true, cuenta: null, lista: [1, 2, 3] });
});
