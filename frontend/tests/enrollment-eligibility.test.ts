import assert from "node:assert/strict";
import { test } from "node:test";
import { getEligibleStudents } from "../src/lib/enrollment-eligibility";
import type { Student } from "../src/types/academic";

function student(id: string): Student {
  return { id, codigo: `EST-${id}`, nombres: "A", apellidos: "B" } as Student;
}

test("selector excluye matriculas 2026 activas, retiradas y trasladadas", () => {
  const a = student("1");
  const b = student("2");
  const retirada = student("3");
  const trasladada = student("4");
  assert.deepEqual(
    getEligibleStudents([a, b, retirada, trasladada], new Set(["1", "3", "4"])).map((s) => s.id),
    ["2"],
  );
});

test("tras matricular B, B desaparece y el selector queda vacio", () => {
  const b = student("2");
  assert.deepEqual(getEligibleStudents([b], ["2"]), []);
  assert.deepEqual(getEligibleStudents([b], []), [b]);
});

test("acepta arreglo o nulo como conjunto de matriculados", () => {
  const a = student("1");
  assert.deepEqual(getEligibleStudents([a], null).map((s) => s.id), ["1"]);
  assert.deepEqual(getEligibleStudents([a], undefined).map((s) => s.id), ["1"]);
});
