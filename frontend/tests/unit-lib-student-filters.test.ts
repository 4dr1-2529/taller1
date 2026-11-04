import test from "node:test";
import assert from "node:assert/strict";
import {
  parseGradoNumero,
  parseSeccionLetra,
  salónLabel,
  filterStudents,
  filterCourses,
  uniqueGradosFromSecciones,
  seccionesForGrado,
  teachersForSelect,
  salonShortFromSeccion,
  lmsActivityTier,
  notaEstado,
} from "../src/lib/student-filters.js";
import { localSearchMatch } from "../src/lib/search-text.js";

function matchSearchExport(student: any, q: string) {
  if (!q.trim()) return true;
  return localSearchMatch(`${student.nombres} ${student.apellidos} ${student.codigo}`, q);
}

const seccion = (overrides: any = {}) => ({
  id: "sec-1",
  gradoId: 2,
  gradoLabel: "2° A",
  nombre: "A",
  ...overrides,
});

test("parseGradoNumero extrae el grado de la etiqueta", () => {
  assert.strictEqual(parseGradoNumero("2° A"), 2);
  assert.strictEqual(parseGradoNumero("6° B"), 6);
  assert.strictEqual(parseGradoNumero("Sin grado"), null);
});

test("parseSeccionLetra valida letras A-D", () => {
  assert.strictEqual(parseSeccionLetra("2° A"), "A");
  assert.strictEqual(parseSeccionLetra("primaria C"), "C");
  assert.strictEqual(parseSeccionLetra("2° X"), "");
  assert.strictEqual(parseSeccionLetra("2° AB"), "");
});

test("salónLabel combina grado y letra", () => {
  assert.strictEqual(salónLabel(2, "A"), "2A");
  assert.strictEqual(salónLabel(null, "A"), "—");
  assert.strictEqual(salónLabel(2, ""), "—");
  assert.strictEqual(salónLabel(null, ""), "—");
});

test("matchSearch vacío devuelve todos; búsqueda coincide", () => {
  const s = { nombres: "Ana García", apellidos: "Pérez", codigo: "001" } as any;
  assert.strictEqual(matchSearchExport(s, ""), true);
  assert.strictEqual(matchSearchExport(s, "ana"), true);
  assert.strictEqual(matchSearchExport(s, "001"), true);
  assert.strictEqual(matchSearchExport(s, "zzz"), false);
});

test("filterStudents por sección, grado, estado y búsqueda", () => {
  const students = [
    { id: "1", seccionId: "sec-1", estado: "activa", nombres: "Ana", apellidos: "G", codigo: "001" } as any,
    { id: "2", seccionId: "sec-2", estado: "trasladada", nombres: "Luis", apellidos: "P", codigo: "002" } as any,
  ];
  const secciones = [seccion(), { ...seccion(), id: "sec-2", gradoId: 3 }];

  assert.strictEqual(filterStudents(students, { seccionId: "sec-1" } as any, secciones).length, 1);
  assert.strictEqual(filterStudents(students, { gradoId: "3", seccionId: "" } as any, secciones).length, 1);
  assert.strictEqual(filterStudents(students, { estado: "trasladada" } as any, secciones).length, 1);
  assert.strictEqual(filterStudents(students, { search: "Luis" } as any, secciones).length, 1);
  assert.strictEqual(filterStudents(students, { search: "zzz" } as any, secciones).length, 0);
});

test("filterCourses por profesor, sección, grado e id", () => {
  const courses = [
    { id: "c-1", profesorId: "p-1", seccionId: "sec-1" } as any,
    { id: "c-2", profesorId: "p-2", seccionId: undefined } as any,
    { id: "c-3", profesorId: "p-1", seccionId: "sec-2" } as any,
  ];
  const secciones = [seccion(), { ...seccion(), id: "sec-2", gradoId: 3 }];

  assert.strictEqual(filterCourses(courses, { profesorId: "p-1" } as any, secciones).length, 2);
  assert.strictEqual(filterCourses(courses, { seccionId: "sec-1" } as any, secciones).length, 2);
  // curso sin seccionId coincide con cualquier grado
  assert.strictEqual(filterCourses(courses, { gradoId: "3" } as any, secciones).length, 2);
  assert.strictEqual(filterCourses(courses, { courseId: "c-2" } as any, secciones).length, 1);
});

test("uniqueGradosFromSecciones agrupa y ordena", () => {
  const secciones = [
    { ...seccion(), id: "a", gradoId: 3, gradoLabel: "3° B" },
    { ...seccion(), id: "b", gradoId: 2, gradoLabel: "2° A" },
    { ...seccion(), id: "c", gradoId: 3, gradoLabel: "3° C" },
  ];
  const out = uniqueGradosFromSecciones(secciones);
  assert.deepStrictEqual(out, [
    { id: "2", label: "2°" },
    { id: "3", label: "3°" },
  ]);
});

test("seccionesForGrado devuelve todas si no hay grado", () => {
  const secciones = [seccion(), { ...seccion(), id: "x", gradoId: 3 }];
  assert.strictEqual(seccionesForGrado(secciones, "").length, 2);
  assert.strictEqual(seccionesForGrado(secciones, "2").length, 1);
});

test("teachersForSelect y salonShortFromSeccion", () => {
  const teachers = [{ id: "t-1", nombres: "Ana", apellidos: "G" } as any];
  assert.deepStrictEqual(teachersForSelect(teachers), [{ id: "t-1", label: "Ana G" }]);
  assert.strictEqual(salonShortFromSeccion(seccion()), "2°A");
  assert.strictEqual(salonShortFromSeccion({ ...seccion(), gradoLabel: "Sin grado", gradoId: "x" }), "x°A");
});

test("lmsActivityTier y notaEstado", () => {
  const s = { metrics: { lms: { engagement: "medio", actividadSemanalPct: [50], minutosPorSemana: [120], horasPlataformaSemana: 5 } } } as any;
  assert.ok(["baja", "media", "alta"].includes(lmsActivityTier(s)));
  assert.strictEqual(notaEstado(15), "Aprobado");
  assert.strictEqual(notaEstado(13), "En riesgo");
  assert.strictEqual(notaEstado(13, 10), "Desaprobado");
  assert.strictEqual(notaEstado(9), "Desaprobado");
});
