import test from "node:test";
import assert from "node:assert/strict";
import { mapUserWithRole } from "../../src/utils/rol.js";

test("mapUserWithRole reemplaza rol por su código y elimina el objeto rol", () => {
  const user = { id: 7n, nombres: "Ana", apellidos: "Pérez", rol: { codigo: "docente" } };
  const result = mapUserWithRole(user);
  assert.deepStrictEqual(result, { id: 7n, nombres: "Ana", apellidos: "Pérez", role: "docente" });
});

test("mapUserWithRole no muta el objeto de entrada", () => {
  const user = { id: 1n, rol: { codigo: "admin" } };
  mapUserWithRole(user);
  assert.ok("rol" in user);
  assert.strictEqual(user.rol.codigo, "admin");
});
