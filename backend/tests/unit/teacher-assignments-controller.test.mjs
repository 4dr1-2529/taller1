import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import {
  listTeacherAssignments,
  getTeacherAssignment,
  postTeacherAssignment,
  postTutorAssignment,
  patchDeactivateAssignment,
} from "../../src/controllers/teacher-assignments.controller.js";

const makeRes = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});
const nextFn = (error) => { throw error; };

test("teacher assignments list responds with validated, empty result", async () => {
  const original = prisma.teacherCourseAssignment.findMany;
  prisma.teacherCourseAssignment.findMany = test.mock.fn(async () => []);
  try {
    const res = makeRes();
    await listTeacherAssignments({ query: {} }, res, nextFn);
    assert.deepEqual(res.body.data, { items: [], total: 0 });
  } finally {
    prisma.teacherCourseAssignment.findMany = original;
  }
});

test("teacher assignment endpoints forward invalid identifiers and schemas", async () => {
  await assert.rejects(
    getTeacherAssignment({ params: { id: "invalid" } }, makeRes(), nextFn),
    (error) => error.statusCode === 400,
  );
  await assert.rejects(
    postTeacherAssignment({ body: {} }, makeRes(), nextFn),
    (error) => error.name === "ZodError",
  );
  await assert.rejects(
    postTutorAssignment({ body: {} }, makeRes(), nextFn),
    (error) => error.name === "ZodError",
  );
  await assert.rejects(
    patchDeactivateAssignment({ params: { id: "invalid" } }, makeRes(), nextFn),
    (error) => error.statusCode === 400,
  );
});

test("get endpoint returns a mapped assignment for a valid identifier", async () => {
  const original = prisma.teacherCourseAssignment.findUnique;
  prisma.teacherCourseAssignment.findUnique = test.mock.fn(async () => ({
    id: 51n,
    profesorId: 8n,
    cursoId: 9n,
    gradoId: 4n,
    seccionId: 40n,
    anioLectivoId: 2026n,
    cursoOfertaId: 90n,
    esTutor: false,
    activo: true,
    profesor: { id: 8n, nombres: "Luis", apellidos: "Sol", codigo: "P8" },
    curso: { id: 9n, codigo: "MAT", nombre: "Matemática" },
    grado: { id: 4n, numero: 4, nombre: "Cuarto" },
    seccion: { id: 40n, nombre: "A" },
    anioLectivo: { id: 2026n, anio: 2026, nombre: "2026" },
  }));
  try {
    const res = makeRes();
    await getTeacherAssignment({ params: { id: "51" } }, res, nextFn);
    assert.equal(res.body.data.item.id, "51");
    assert.equal(res.body.data.item.profesor.nombre, "Luis Sol");
  } finally {
    prisma.teacherCourseAssignment.findUnique = original;
  }
});
