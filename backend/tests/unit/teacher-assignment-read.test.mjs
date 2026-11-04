import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { countActiveAssignmentsForTeacher, getAssignmentById, getTeacherWorkload, listAssignments, syncCourseOffering } from "../../src/services/teacher-assignment.service.js";

function replace(target, key, implementation) {
  const original = target[key];
  target[key] = implementation;
  return () => { target[key] = original; };
}

const row = {
  id: 9n, profesorId: 1n, cursoId: 2n, gradoId: 3n, seccionId: 4n,
  anioLectivoId: 5n, cursoOfertaId: null, esTutor: true, activo: true,
  profesor: { id: 1n, nombres: "Luis", apellidos: "Rojas", codigo: "P1" },
  curso: { id: 2n, codigo: "MAT", nombre: "Matemática" },
  grado: { id: 3n, numero: 2, nombre: "Segundo" },
  seccion: { id: 4n, nombre: "A" },
  anioLectivo: { id: 5n, anio: 2026, nombre: "2026" },
};

test("listAssignments aplica filtros convertidos a bigint y transforma relaciones para la API", async () => {
  let query;
  const restore = replace(prisma.teacherCourseAssignment, "findMany", async (args) => { query = args; return [row]; });
  try {
    const result = await listAssignments({ profesorId: "1", cursoId: "2", gradoId: "3", seccionId: "4", anioLectivoId: "5", esTutor: false, activo: false });
    assert.deepStrictEqual(query.where, {
      activo: false, profesorId: 1n, cursoId: 2n, gradoId: 3n, seccionId: 4n,
      anioLectivoId: 5n, esTutor: false,
    });
    assert.strictEqual(query.take, 500);
    assert.strictEqual(result[0].id, "9");
    assert.strictEqual(result[0].profesor.nombre, "Luis Rojas");
    assert.strictEqual(result[0].grado.label, "2°");
    assert.strictEqual(result[0].seccion.label, "2° A");
    assert.strictEqual(result[0].tipoAsignacion, "Tutor de aula");
    assert.strictEqual(result[0].cursoOfertaId, null);
  } finally { restore(); }
});

test("listAssignments usa solo asignaciones activas por defecto y admite lista vacía", async () => {
  let where;
  const restore = replace(prisma.teacherCourseAssignment, "findMany", async (args) => { where = args.where; return []; });
  try {
    assert.deepStrictEqual(await listAssignments(), []);
    assert.deepStrictEqual(where, { activo: true });
  } finally { restore(); }
});

test("getAssignmentById transforma fila encontrada y produce 404 si no existe", async () => {
  let where;
  const restore = replace(prisma.teacherCourseAssignment, "findUnique", async (args) => { where = args.where; return row; });
  try {
    assert.strictEqual((await getAssignmentById("9")).profesorId, "1");
    assert.deepStrictEqual(where, { id: 9n });
  } finally { restore(); }
  const restoreMissing = replace(prisma.teacherCourseAssignment, "findUnique", async () => null);
  try {
    await assert.rejects(getAssignmentById("9"), (error) => error.statusCode === 404 && error.message === "Asignación no encontrada");
  } finally { restoreMissing(); }
});

test("countActiveAssignmentsForTeacher cuenta solo relaciones activas del profesor", async () => {
  let query;
  const restore = replace(prisma.teacherCourseAssignment, "count", async (args) => { query = args; return 6; });
  try {
    assert.strictEqual(await countActiveAssignmentsForTeacher(12n), 6);
    assert.deepStrictEqual(query.where, { profesorId: 12n, activo: true });
  } finally { restore(); }
});

test("getTeacherWorkload deduplica cursos y salones, ordena grados y reporta polidocencia", async () => {
  const rows = [
    { cursoId: 30n, seccionId: 40n, esTutor: false, curso: { id: 30n, codigo: "MAT", nombre: "Matemática" }, grado: { numero: 4 }, seccion: { nombre: "B" } },
    { cursoId: 31n, seccionId: 40n, esTutor: false, curso: { id: 31n, codigo: "COM", nombre: "Comunicación" }, grado: { numero: 4 }, seccion: { nombre: "B" } },
    { cursoId: 32n, seccionId: 41n, esTutor: true, curso: { id: 32n, codigo: "CIE", nombre: "Ciencia" }, grado: { numero: 2 }, seccion: { nombre: "A" } },
  ];
  let query;
  const restoreRows = replace(prisma.teacherCourseAssignment, "findMany", async (args) => { query = args; return rows; });
  const restoreCount = replace(prisma.student, "count", async (args) => { assert.deepStrictEqual(args.where.seccionId.in, [40n, 41n]); return 27; });
  try {
    const result = await getTeacherWorkload(8n);
    assert.deepStrictEqual(query.where, { profesorId: 8n, activo: true });
    assert.strictEqual(result.tipoAsignacion, "Tutor y docente por curso");
    assert.strictEqual(result.esTutor, true);
    assert.deepStrictEqual(result.grados, ["2°", "4°"]);
    assert.strictEqual(result.cargaAcademica, 3);
    assert.strictEqual(result.totalAlumnos, 27);
    assert.deepStrictEqual(result.polidocencia, { cursosDistintos: 2, maxCursos: result.polidocencia.maxCursos, salonesDistintos: 1, maxSalones: result.polidocencia.maxSalones });
    assert.strictEqual(result.cursos.length, 3);
  } finally { restoreRows(); restoreCount(); }
});

test("getTeacherWorkload vacío evita contar alumnos y produce carga vacía", async () => {
  const restoreRows = replace(prisma.teacherCourseAssignment, "findMany", async () => []);
  const restoreCount = replace(prisma.student, "count", async () => { assert.fail("no debe contar sin secciones asignadas"); });
  try {
    const result = await getTeacherWorkload(8n);
    assert.strictEqual(result.totalAlumnos, 0);
    assert.strictEqual(result.tipoAsignacion, "Docente por curso");
    assert.deepStrictEqual(result.cursos, []);
    assert.deepStrictEqual(result.polidocencia, { cursosDistintos: 0, maxCursos: result.polidocencia.maxCursos, salonesDistintos: 0, maxSalones: result.polidocencia.maxSalones });
  } finally { restoreRows(); restoreCount(); }
});
test("syncCourseOffering crea la oferta codificada y matricula estudiantes activos una vez", async () => {
  const calls = { upsert: null, assignment: null, enrollments: null };
  const tx = {
    seccion: { findUniqueOrThrow: async () => ({ id: 4n, nombre: "A", grado: { numero: 4, nivel: { codigo: "secundaria" } } }) },
    cursoCatalogo: { findUniqueOrThrow: async () => ({ codigo: " mat " }) },
    course: { upsert: async (args) => { calls.upsert = args; return { id: 90n }; } },
    teacherCourseAssignment: { update: async (args) => { calls.assignment = args; } },
    matricula: { findMany: async () => [{ estudianteId: 12n }, { estudianteId: 13n }] },
    enrollment: { createMany: async (args) => { calls.enrollments = args; } },
  };
  const result = await syncCourseOffering({ id: 7n, profesorId: 8n, cursoId: 9n, seccionId: 4n, anioLectivoId: 2026n, activo: true }, undefined, tx);
  assert.deepStrictEqual(calls.upsert.create, { codigo: "MAT-4A", cursoId: 9n, seccionId: 4n, profesorId: 8n, anioLectivoId: 2026n, activo: true });
  assert.deepStrictEqual(calls.assignment, { where: { id: 7n }, data: { cursoOfertaId: 90n } });
  assert.deepStrictEqual(calls.enrollments, { data: [{ studentId: 12n, cursoOfertaId: 90n }, { studentId: 13n, cursoOfertaId: 90n }], skipDuplicates: true });
  assert.deepStrictEqual(result, { id: 90n });
});

test("syncCourseOffering no consulta matrículas si la asignación está inactiva", async () => {
  let enrollmentsRead = false;
  const tx = {
    seccion: { findUniqueOrThrow: async () => ({ id: 4n, nombre: "B", grado: { numero: 3 } }) },
    cursoCatalogo: { findUniqueOrThrow: async () => ({ codigo: "SCI" }) },
    course: { upsert: async () => ({ id: 91n }) },
    teacherCourseAssignment: { update: async () => {} },
    matricula: { findMany: async () => { enrollmentsRead = true; return []; } },
    enrollment: { createMany: async () => assert.fail("no debe matricular una asignación inactiva") },
  };
  await syncCourseOffering({ id: 7n, profesorId: 8n, cursoId: 9n, seccionId: 4n, anioLectivoId: 2026n, activo: false }, undefined, tx);
  assert.strictEqual(enrollmentsRead, false);
});