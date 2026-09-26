import assert from "node:assert/strict";
import { test } from "node:test";
import { localSearchMatch, normalizeSearchText } from "../src/lib/search-text";
import { matchSearch } from "../src/lib/student-filters";
import type { Student } from "../src/types/academic";

function student(nombres: string, apellidos: string, codigo: string): Student {
  return { id: codigo, nombres, apellidos, codigo } as Student;
}

test("Jose encuentra José (búsqueda local sin tildes)", () => {
  assert.equal(normalizeSearchText("José"), normalizeSearchText("Jose"));
  assert.ok(localSearchMatch("José Pérez", "Jose"));
  assert.ok(localSearchMatch("Jose Perez", "josé"));
});

test("Matematica encuentra Matemática", () => {
  assert.ok(localSearchMatch("Matemática", "Matematica"));
  assert.ok(localSearchMatch("Lenguaje y Comunicación", "lenguaje y comunicacion"));
  assert.ok(localSearchMatch("Ciencia, Tecnología e Innovación", "Ciencia, tecnologia"));
});

test("las mayúsculas y el espacio sobrante no afectan", () => {
  assert.ok(localSearchMatch("Rosa Mamani Quispe", "  ROSA mamani "));
  assert.ok(!localSearchMatch("Rosa Mamani", "Juan"));
});

test("término vacío significa 'sin filtro'", () => {
  assert.equal(localSearchMatch("cualquier texto", "   "), true);
  assert.equal(normalizeSearchText("  ÁÉÍÓÚ Ñ  "), "aeiou n");
});

test("matchSearch (estudiantes) usa la misma normalización", () => {
  const josé = student("José", "Pérez", "EST-01");
  assert.equal(matchSearch(josé, "jose"), true);
  assert.equal(matchSearch(josé, "pérez"), true);
  assert.equal(matchSearch(josé, "EST-01"), true);
  assert.equal(matchSearch(josé, "carlos"), false);
  assert.equal(matchSearch(josé, ""), true);
});
