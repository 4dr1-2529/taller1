import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../src/utils/prisma.js';
import { listTeachers, createTeacher, updateTeacher, deleteTeacher, createTeacherAccount, getTeacherDetail } from '../../src/controllers/teachers.controller.js';
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

test('createTeacher registra un perfil y serializa cursos y usuario opcional', async t => {
  const registered = { ...teacher, usuarioId: null, cursosOferta: [
    { id: 4n, codigo: 'MAT-2B', seccionId: 9n, cursoCatalogo: { nombre: 'Matemática', codigo: 'MAT' } },
    { id: 5n, codigo: 'HIS-2B', seccionId: 9n, cursoCatalogo: null },
  ] };
  replace(t, prisma, '$transaction', async callback => callback({
    user: { findFirst: async () => null },
    teacher: {
      findFirst: async () => null,
      findMany: async () => [{ codigo: 'PROF-004' }],
      create: async () => registered,
    },
    student: { findFirst: async () => null },
    role: { findUniqueOrThrow: async () => ({ id: 2n }) },
    correlativo: {
      upsert: async () => undefined,
      updateMany: async () => undefined,
      update: async () => ({ ultimoNumero: 5 }),
    },
    auditLog: { create: async () => undefined },
  }));
  const result = await invoke(createTeacher, {
    dni: '12345678', nombres: 'Ana', apellidos: 'Paz', especialidad: 'Ciencias', correo: 'ana@example.test', telefono: '', crearCuenta: false,
  });
  assert.ifError(result.error);
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.data.teacher.id, '7');
  assert.equal(result.body.data.teacher.userId, null);
  assert.deepEqual(result.body.data.teacher.courses, [
    { id: '4', codigo: 'MAT-2B', nombre: 'Matemática', seccionId: '9' },
    { id: '5', codigo: 'HIS-2B', nombre: 'HIS-2B', seccionId: '9' },
  ]);
});

test('createTeacher propaga validación inválida sin abrir transacción', async t => {
  const transaction = replace(t, prisma, '$transaction', async () => { throw new Error('no debe iniciar transacción'); });
  const result = await invoke(createTeacher, { dni: '123', nombres: 'A', correo: 'correo inválido' });
  assert.ok(result.error);
  assert.equal(transaction.mock.callCount(), 0);
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

test('createTeacherAccount vincula la cuenta nueva y devuelve el perfil serializado', async t => {
  const updated = { ...teacher, usuarioId: 12n, cursosOferta: [], usuario: { id: 12n, email: teacher.email, activo: true } };
  replace(t, prisma.teacher, 'findUnique', async () => ({ ...teacher, usuarioId: null }));
  replace(t, prisma.user, 'findUnique', async () => null);
  replace(t, prisma.role, 'findUnique', async () => ({ id: 3n }));
  replace(t, prisma, '$transaction', async callback => callback({
    user: { create: async () => ({ id: 12n }) },
    teacher: { update: async () => updated },
  }));
  replace(t, prisma.auditLog, 'create', async () => undefined);
  const result = await invoke(createTeacherAccount, { password: 'StrongPass1' });
  assert.ifError(result.error);
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.data.teacher.userId, '12');
  assert.equal(result.body.data.teacher.id, '7');
  assert.deepEqual(result.body.data.teacher.courses, []);
});

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

test('getTeacherDetail devuelve el perfil y carga vacía de un profesor activo', async t => {
  replace(t, prisma.teacher, 'findFirst', async () => teacher);
  replace(t, prisma.teacherCourseAssignment, 'findMany', async () => []);
  const result = await invoke(getTeacherDetail);
  assert.ifError(result.error);
  assert.equal(result.body.data.teacher.id, '7');
  assert.equal(result.body.data.teacher.correo, teacher.email);
  assert.equal(result.body.data.workload.cargaAcademica, 0);
  assert.deepEqual(result.body.data.workload.asignaciones, []);
});
