import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { listCourses, updateCourse, deleteCourse, reassignCourse } = await import("../../src/controllers/courses.controller.js");

const makeReq = (overrides = {}) => ({ query: {}, params: {}, body: {}, user: undefined, ...overrides });
const makeRes = () => {
  const res = {
    status: (code) => ({ json: (body) => { res.body = body; res.statusCode = code; return res; } }),
    statusCode: 200,
    body: null,
  };
  return res;
};
const nextFn = (e) => { throw e; };

test("courses: listCourses admin devuelve items", async () => {
  const orig = mockPrisma(prisma.course, "findMany", async () => ([
    { id: 1n, codigo: "MAT", nombre: "Matemática", activo: true, profesorId: 1n, seccionId: 1n, cursoCatalogo: null, profesor: null, seccion: null },
  ]));
  const res = makeRes();
  await listCourses(
    { query: {}, user: { role: "admin", sub: "1" } },
    res, nextFn,
  );
  assert.strictEqual(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.data.items));
  prisma.course.findMany = orig;
});

test("courses: listCourses docente sin teacher devuelve vacío", async () => {
  const orig = mockPrisma(prisma.teacher, "findFirst", async () => null);
  const res = makeRes();
  await listCourses(
    { query: {}, user: { role: "docente", sub: "7" } },
    res, nextFn,
  );
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.data.items, []);
  prisma.teacher.findFirst = orig;
});

test("courses: listCourses docente con teacher filtra por profesor", async () => {
  const orig1 = mockPrisma(prisma.teacher, "findFirst", async () => ({ id: 5n }));
  const orig2 = mockPrisma(prisma.course, "findMany", async () => ([]));
  const res = makeRes();
  await listCourses(
    { query: {}, user: { role: "docente", sub: "7" } },
    res, nextFn,
  );
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.data.items, []);
  prisma.teacher.findFirst = orig1;
  prisma.course.findMany = orig2;
});

test("courses: updateCourse rechaza reasignación de profesor", async () => {
  const res = makeRes();
  let error;
  try {
    await updateCourse(
      { params: { id: "1" }, body: { profesorId: "2" }, user: { sub: "1", role: "admin" } },
      res, nextFn,
    );
  } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 400);
});

test("courses: filtra los cursos de estudiantes y serializa los filtros administrativos", async () => {
  const original = prisma.course.findMany;
  let args;
  prisma.course.findMany = test.mock.fn(async (query) => {
    args = query;
    return [{ id: 4n, codigo: "MAT", nombre: "Matemática", activo: true, cursoCatalogo: null, profesor: null, seccion: null }];
  });
  try {
    const studentRes = makeRes();
    await listCourses({ query: {}, user: { role: "estudiante", sub: "9" } }, studentRes, nextFn);
    assert.equal(args.where.inscripciones.some.student.usuarioId, 9n);
    assert.equal(studentRes.body.data.items[0].id, "4");

    const filteredRes = makeRes();
    await listCourses({ query: { seccionId: "2", profesorId: "3" }, user: { role: "admin", sub: "1" } }, filteredRes, nextFn);
    assert.equal(args.where.seccionId, 2n);
    assert.equal(args.where.profesorId, 3n);
  } finally {
    prisma.course.findMany = original;
  }
});

test("courses: actualiza una oferta sin notas, rechaza cambios de sección y protege notas", async () => {
  const restoreCount = prisma.grade.count;
  const restoreUpdate = prisma.course.update;
  const restoreAudit = prisma.auditLog.create;
  prisma.grade.count = test.mock.fn(async () => 0);
  prisma.course.update = test.mock.fn(async ({ where }) => ({
    id: where.id, codigo: "MAT", nombre: "Matemática", activo: false,
    cursoCatalogo: null, profesor: null, seccion: null,
  }));
  prisma.auditLog.create = test.mock.fn(async () => ({}));
  try {
    const res = makeRes();
    await updateCourse({ params: { id: "8" }, body: { activo: false }, user: { sub: "1" } }, res, nextFn);
    assert.equal(res.body.data.course.id, "8");
    assert.equal(res.body.data.course.activo, false);

    await assert.rejects(
      updateCourse({ params: { id: "8" }, body: { seccionId: "3" } }, makeRes(), nextFn),
      (error) => error.statusCode === 400,
    );

    prisma.grade.count = test.mock.fn(async () => 1);
    await assert.rejects(
      updateCourse({ params: { id: "8" }, body: { activo: false } }, makeRes(), nextFn),
      (error) => error.statusCode === 409,
    );
  } finally {
    prisma.grade.count = restoreCount;
    prisma.course.update = restoreUpdate;
    prisma.auditLog.create = restoreAudit;
  }
});

test("courses: elimina lógicamente una oferta sin notas y bloquea la que tiene notas", async () => {
  const restoreCount = prisma.grade.count;
  const restoreUpdate = prisma.course.update;
  const restoreAudit = prisma.auditLog.create;
  let updateArgs;
  prisma.grade.count = test.mock.fn(async () => 0);
  prisma.course.update = test.mock.fn(async (args) => { updateArgs = args; return {}; });
  prisma.auditLog.create = test.mock.fn(async () => ({}));
  try {
    const res = makeRes();
    await deleteCourse({ params: { id: "12" }, user: { sub: "1" } }, res, nextFn);
    assert.deepEqual(updateArgs, { where: { id: 12n }, data: { activo: false } });
    assert.equal(res.body.message, "Curso desactivado");

    prisma.grade.count = test.mock.fn(async () => 1);
    await assert.rejects(
      deleteCourse({ params: { id: "12" }, user: { sub: "1" } }, makeRes(), nextFn),
      (error) => error.statusCode === 409,
    );
  } finally {
    prisma.grade.count = restoreCount;
    prisma.course.update = restoreUpdate;
    prisma.auditLog.create = restoreAudit;
  }
});

test("courses: exige profesor para reasignar una oferta", async () => {
  await assert.rejects(
    reassignCourse({ params: { id: "8" }, body: {}, user: { sub: "1" } }, makeRes(), nextFn),
    (error) => error.statusCode === 400,
  );
});
