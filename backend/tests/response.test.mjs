/**
 * Formato estándar de respuestas API
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function successPayload(data, message = "Operación realizada correctamente") {
  return { success: true, message, data };
}

function errorPayload(message, errors = []) {
  return { success: false, message, errors };
}

describe("API response envelope", () => {
  it("éxito incluye success, message y data", () => {
    const body = successPayload({ items: [] });
    assert.equal(body.success, true);
    assert.equal(body.message, "Operación realizada correctamente");
    assert.deepEqual(body.data, { items: [] });
  });

  it("error incluye success false y errors array", () => {
    const body = errorPayload("Credenciales incorrectas", ["UNAUTHORIZED"]);
    assert.equal(body.success, false);
    assert.equal(body.message, "Credenciales incorrectas");
    assert.deepEqual(body.errors, ["UNAUTHORIZED"]);
  });
});
