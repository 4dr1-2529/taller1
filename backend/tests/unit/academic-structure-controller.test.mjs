import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const {
  listNiveles,
  listSecciones,
  listCursosCatalogo,
  listAniosLectivos,
  createSeccion,
} = await import("../../src/controllers/academic-structure.controller.js");

const makeReq = (overrides = {}) => ({ query: {}, params: {}, user: undefined, ...overrides });
const makeRes = () => {
  const res = {
    status: (code) => ({ json: (body) => { res.body = body; res.statusCode = code; return res; } }),
    statusCode: 200,
    body: null,
  };
  return res;
};
const nextFn = (e) => { throw e; };

test("academicStructure: listNiveles devuelve items", async () => {
  const orig = mockPrisma(prisma.nivelEducativo, "findMany", async () => ([
    { id: 1n, codigo: "primaria", nombre: "Primaria", grados: [], _count: { secciones: 0, cursosGrado: 0 } },
  ]));
  const res = makeRes();
  await listNiveles({}, res, nextFn);
  assert.strictEqual(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.data.items));
  prisma.nivelEducativo.findMany = orig;
});

test("academicStructure: listSecciones sin filtro docente", async () => {
  const orig = mockPrisma(prisma.seccion, "findMany", async () => ([
    { id: 1n, gradoId: 1n, nombre: "A", activo: true, grado: { nivel: { codigo: "primaria" } }, _count: { estudiantes: 0 } },
  ]));
  const res = makeRes();
  await listSecciones({ query: {}, user: { role: "admin", sub: "1" } }, res, nextFn);
  assert.strictEqual(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.data.items));
  prisma.seccion.findMany = orig;
});

test("academicStructure: listSecciones con gradoId", async () => {
  const orig = mockPrisma(prisma.seccion, "findMany", async () => ([]));
  const res = makeRes();
  await listSecciones({ query: { gradoId: "1" }, user: { role: "admin", sub: "1" } }, res, nextFn);
  assert.strictEqual(res.statusCode, 200);
  prisma.seccion.findMany = orig;
});

test("academicStructure: listSecciones docente sin secciones devuelve vacío", async () => {
  const orig1 = mockPrisma(prisma.teacher, "findFirst", async () => ({ id: 5n }));
  const orig2 = mockPrisma(prisma.teacherCourseAssignment, "findMany", async () => ([]));
  const res = makeRes();
  await listSecciones({ query: {}, user: { role: "docente", sub: "7" } }, res, nextFn);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.data.items, []);
  prisma.teacher.findFirst = orig1;
  prisma.teacherCourseAssignment.findMany = orig2;
});

test("academicStructure: docente ve solo secciones asignadas con filtro académico", async () => {
  const originals = [
    prisma.teacher.findFirst,
    prisma.teacherCourseAssignment.findMany,
    prisma.seccion.findMany,
  ];
  let sectionArgs;
  prisma.teacher.findFirst = test.mock.fn(async () => ({ id: 5n }));
  prisma.teacherCourseAssignment.findMany = test.mock.fn(async () => ([
    { seccionId: 4n },
  ]));
  prisma.seccion.findMany = test.mock.fn(async (args) => {
    sectionArgs = args;
    return [{ id: 4n, gradoId: 2n, nombre: "A", activo: true, grado: { nivel: { codigo: "primaria" } }, _count: { estudiantes: 1 } }];
  });
  try {
    const res = makeRes();
    await listSecciones({ query: { gradoId: "2" }, user: { role: "docente", sub: "7" } }, res, nextFn);
    assert.deepEqual(sectionArgs.where.id.in, [4n]);
    assert.equal(sectionArgs.where.gradoId, 2n);
    assert.equal(res.body.data.items[0].id, "4");
  } finally {
    prisma.teacher.findFirst = originals[0];
    prisma.teacherCourseAssignment.findMany = originals[1];
    prisma.seccion.findMany = originals[2];
  }
});

test("academicStructure: lista catálogo por grado y catálogo activo general", async () => {
  const restoreCourseGrade = prisma.cursoGrado.findMany;
  const restoreCatalog = prisma.cursoCatalogo.findMany;
  prisma.cursoGrado.findMany = test.mock.fn(async () => ([
    { id: 6n, gradoId: 2n, curso: { id: 3n, codigo: "MAT", nombre: "Matemática" }, grado: { id: 2n } },
  ]));
  prisma.cursoCatalogo.findMany = test.mock.fn(async () => ([
    { id: 3n, codigo: "MAT", nombre: "Matemática", activo: true },
  ]));
  try {
    const byGrade = makeRes();
    await listCursosCatalogo({ query: { gradoId: "2" } }, byGrade, nextFn);
    assert.equal(byGrade.body.data.items[0].id, "6");
    assert.equal(byGrade.body.data.items[0].cursoCatalogo.nombre, "Matemática");

    const all = makeRes();
    await listCursosCatalogo({ query: {} }, all, nextFn);
    assert.equal(all.body.data.items[0].id, "3");
  } finally {
    prisma.cursoGrado.findMany = restoreCourseGrade;
    prisma.cursoCatalogo.findMany = restoreCatalog;
  }
});

test("academicStructure: serializa años lectivos y crea sección con valores normalizados", async () => {
  const restoreYears = prisma.anioLectivo.findMany;
  const restoreSection = prisma.seccion.create;
  prisma.anioLectivo.findMany = test.mock.fn(async () => ([
    { id: 2026n, anio: 2026, nombre: "2026", activo: true },
  ]));
  let createArgs;
  prisma.seccion.create = test.mock.fn(async (args) => {
    createArgs = args;
    return { id: 15n, ...args.data, grado: { id: 4n, nivel: { codigo: "primaria" } } };
  });
  try {
    const years = makeRes();
    await listAniosLectivos({}, years, nextFn);
    assert.equal(years.body.data.items[0].id, "2026");

    const created = makeRes();
    await createSeccion({ body: { gradoId: 4, nombre: "a" } }, created, nextFn);
    assert.equal(createArgs.data.nombre, "A");
    assert.equal(createArgs.data.capacidad, 30);
    assert.equal(created.statusCode, 201);
    assert.equal(created.body.data.item.id, "15");
  } finally {
    prisma.anioLectivo.findMany = restoreYears;
    prisma.seccion.create = restoreSection;
  }
});
