import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../src/utils/prisma.js';
import { listTeachers, updateTeacher, deleteTeacher, createTeacherAccount, getTeacherDetail } from '../../src/controllers/teachers.controller.js';
function replace(t, target, key, implementation) {
  const original = target[key];
  const mock = t.mock.fn(implementation);
  target[key] = mock;
  t.after(() => { target[key] = original; });
  return mock;
}
const teacher = { id: 7n, nombres: 'Ana', apellidos: 'Sol', email: 'teacher@example.test', usuarioId: 12n, activo: true,
  cursosOferta: [{ id: 3n, codigo: 'MAT', seccionId: 2n, cursoCatalogo: { nombre: 'Matemática', codigo: 'MAT' } }],
  usuario: { id: 12n, email: 'teacher@example.test', activo: true } };
async function invoke(handler, body = {}, id = '7') {
  const res = { body: undefined, statusCode: undefined, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  let error;
  await handler({ params: { id }, body, user: { sub: '1', role: 'admin' }, headers: {}, socket: {}, query: {} }, res, e => { error = e; });
  return { ...res, error };
}

test('listTeachers serializa profesores con y sin cuentas y sus cursos', async t => {
  const find = replace(t, prisma.teacher, 'findMany', async () => [teacher, { ...teacher, usuarioId: null, usuario: null, cursosOferta: [] }]);
  const result = await invoke(listTeachers);
  assert.ifError(result.error);
  assert.equal(find.mock.calls[0].arguments[0].where.activo, true);
  const [linked, unlinked] = result.body.data.items;
  assert.equal(linked.id, '7');
  assert.equal(linked.user.id, '12');
  assert.equal(linked.userId, '12');
  assert.equal(linked.correo, teacher.email);
  assert.deepEqual(linked.courses[0], { id: '3', codigo: 'MAT', nombre: 'Matemática', seccionId: '2' });
  assert.equal(unlinked.user, null);
  assert.equal(unlinked.userId, null);
});

test('listTeachers propaga errores de consulta', async t => {
  const failure = new Error('read failed');
  replace(t, prisma.teacher, 'findMany', async () => { throw failure; });
  assert.equal((await invoke(listTeachers)).error, failure);
});

for (const scenario of ['missing', 'linked', 'email-taken']) {
  test(`createTeacherAccount rechaza ${scenario} antes de crear usuario`, async t => {
    replace(t, prisma.teacher, 'findUnique', async () => scenario === 'missing' ? null : { ...teacher, usuarioId: scenario === 'linked' ? 12n : null });
    replace(t, prisma.user, 'findUnique', async () => userFixture());
    const create = replace(t, prisma.user, 'create', async () => { throw new Error('must not create'); });
    const result = await invoke(createTeacherAccount, { password: 'Fixture-2026-Password!' });
    assert.equal(result.error.statusCode, scenario === 'missing' ? 404 : 409);
    assert.equal(create.mock.callCount(), 0);
  });
}
function userFixture() { return { id: 12n }; }

test('updateTeacher impide desactivar un docente con asignaciones activas', async t => {
  const tx = { teacher: { findUniqueOrThrow: async () => teacher, update: t.mock.fn() }, teacherCourseAssignment: { count: async () => 1 } };
  replace(t, prisma, '$transaction', async fn => fn(tx));
  const result = await invoke(updateTeacher, { activo: false });
  assert.equal(result.error.statusCode, 409);
  assert.equal(tx.teacher.update.mock.callCount(), 0);
});

for (const linked of [true, false]) {
  test(`updateTeacher actualiza perfil y sincroniza cuenta solo si existe: ${linked}`, async t => {
    const profile = { ...teacher, usuarioId: linked ? 12n : null };
    const tx = { teacher: { findUniqueOrThrow: async () => profile, update: t.mock.fn(async () => profile) },
      teacherCourseAssignment: { count: async () => 0 }, user: { update: t.mock.fn(async () => ({})) } };
    replace(t, prisma, '$transaction', async fn => fn(tx));
    replace(t, prisma.auditLog, 'create', async () => ({}));
    const result = await invoke(updateTeacher, { activo: false, telefono: null });
    assert.ifError(result.error);
    assert.equal(tx.teacher.update.mock.calls[0].arguments[0].data.telefono, null);
    assert.equal(tx.user.update.mock.callCount(), linked ? 1 : 0);
    assert.equal(result.body.data.teacher.id, '7');
  });
}

test('deleteTeacher rechaza asignaciones activas sin mutar entidades', async t => {
  replace(t, prisma.teacherCourseAssignment, 'count', async () => 2);
  const transact = replace(t, prisma, '$transaction', async () => { throw new Error('must not write'); });
  const result = await invoke(deleteTeacher);
  assert.equal(result.error.statusCode, 409);
  assert.equal(transact.mock.callCount(), 0);
});

for (const linked of [true, false]) {
  test(`deleteTeacher desactiva cursos, perfil y cuenta vinculada: ${linked}`, async t => {
    replace(t, prisma.teacherCourseAssignment, 'count', async () => 0);
    replace(t, prisma.teacher, 'findUnique', async () => ({ usuarioId: linked ? 12n : null }));
    const tx = { course: { updateMany: t.mock.fn(async () => ({ count: 1 })) }, teacher: { update: t.mock.fn(async () => ({})) }, user: { update: t.mock.fn(async () => ({})) } };
    replace(t, prisma, '$transaction', async fn => fn(tx));
    replace(t, prisma.auditLog, 'create', async () => ({}));
    const result = await invoke(deleteTeacher);
    assert.ifError(result.error);
    assert.deepEqual(tx.course.updateMany.mock.calls[0].arguments[0], { where: { profesorId: 7n }, data: { activo: false } });
    assert.deepEqual(tx.teacher.update.mock.calls[0].arguments[0], { where: { id: 7n }, data: { activo: false } });
    assert.equal(tx.user.update.mock.callCount(), linked ? 1 : 0);
  });
}

test('getTeacherDetail devuelve 404 para un profesor inexistente', async t => {
  replace(t, prisma.teacher, 'findFirst', async () => null);
  assert.equal((await invoke(getTeacherDetail)).error.statusCode, 404);
});
