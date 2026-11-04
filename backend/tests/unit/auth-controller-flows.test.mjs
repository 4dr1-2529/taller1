import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../src/utils/prisma.js';
import { env } from '../../src/config/env.js';
import { login, refresh, logout, changePassword } from '../../src/controllers/auth.controller.js';
import { hashToken, signRefreshToken } from '../../src/utils/tokens.js';

const user = { id: 12n, email: 'auth@example.test', activo: true, passwordHash: 'mock-hash', nombres: 'Ana', apellidos: 'Sol', rol: { codigo: 'admin' }, profesor: null };
function request(body = {}) { return { body, ip: '192.0.2.12', socket: {}, headers: {}, user: { sub: '12', role: 'admin', sid: '8' } }; }
async function invoke(handler, req) {
  const res = { body: undefined, status() { return this; }, json(body) { this.body = body; return this; } };
  let error;
  await handler(req, res, e => { error = e; });
  return { body: res.body, error };
}
const restorations = new WeakMap();
function mockMethod(t, target, key, implementation) {
  let entries = restorations.get(t);
  if (!entries) {
    entries = [];
    restorations.set(t, entries);
    t.after(() => { for (const [object, name, original] of entries) object[name] = original; });
  }
  if (!entries.some(([object, name]) => object === target && name === key)) entries.push([target, key, target[key]]);
  const mock = t.mock.fn(implementation);
  target[key] = mock;
  return mock;
}
function setup(t) {
  mockMethod(t, prisma.auditLog, 'create', async () => ({}));
  mockMethod(t, prisma.user, 'findUnique', async () => user);
  mockMethod(t, prisma.session, 'updateMany', async () => ({ count: 1 }));
}

test('login vincula access y refresh a la sesión creada sin exponer el hash', async t => {
  setup(t);
  mockMethod(t, bcrypt, 'compare', async () => true);
  const create = mockMethod(t, prisma.session, 'create', async () => ({ id: 8n }));
  const result = await invoke(login, request({ email: user.email, password: 'fixture-password' }));
  assert.ifError(result.error);
  const data = result.body.data;
  const access = jwt.verify(data.token, env.JWT_SECRET);
  assert.equal(access.sid, '8');
  assert.equal(access.sub, '12');
  assert.equal(data.user.teacherId, null);
  assert.equal(data.user.passwordHash, undefined);
  assert.equal(create.mock.calls[0].arguments[0].data.tokenHash, hashToken(data.refreshToken));
});

for (const scenario of ['missing', 'inactive', 'wrong-password']) {
  test(`login rechaza credenciales: ${scenario}`, async t => {
    setup(t);
    mockMethod(t, prisma.user, 'findUnique', async () => scenario === 'missing' ? null : { ...user, activo: scenario !== 'inactive' });
    mockMethod(t, bcrypt, 'compare', async () => false);
    const create = mockMethod(t, prisma.session, 'create', async () => { throw new Error('must not create session'); });
    const req = request({ email: user.email, password: 'fixture-password' });
    req.ip = `fixture-${scenario}`;
    const result = await invoke(login, req);
    assert.equal(result.error.statusCode, 401);
    assert.equal(create.mock.callCount(), 0);
  });
}

test('login bloquea el sexto intento y permite intentar de nuevo tras quince minutos', async t => {
  setup(t);
  const find = mockMethod(t, prisma.user, 'findUnique', async () => null);
  const req = request({ email: user.email, password: 'fixture-password' });
  req.ip = '192.0.2.99';
  for (let i = 0; i < 5; i++) assert.equal((await invoke(login, req)).error.statusCode, 401);
  assert.equal((await invoke(login, req)).error.statusCode, 429);
  assert.equal(find.mock.callCount(), 5);
  const later = Date.now() + 16 * 60 * 1000;
  mockMethod(t, Date, 'now', () => later);
  assert.equal((await invoke(login, req)).error.statusCode, 401);
  assert.equal(find.mock.callCount(), 6);
});

test('refresh requiere token y rechaza un access token', async () => {
  assert.equal((await invoke(refresh, request())).error.statusCode, 400);
  const token = jwt.sign({ sub: '12', type: 'access' }, env.JWT_SECRET);
  assert.equal((await invoke(refresh, request({ refreshToken: token }))).error.statusCode, 401);
});

for (const scenario of ['missing', 'inactive', 'rotate', 'race', 'grace', 'reuse']) {
  test(`refresh protege la rotación: ${scenario}`, async t => {
    setup(t);
    const token = signRefreshToken('12', env.JWT_SECRET, '1h');
    const digest = hashToken(token);
    const reused = scenario === 'grace' || scenario === 'reuse';
    mockMethod(t, prisma.session, 'findFirst', async () => scenario === 'missing' ? null : {
      id: 8n, tokenHash: reused ? 'rotated' : digest, refreshHash: reused ? digest : null,
      refreshRotatedAt: new Date(Date.now() - (scenario === 'reuse' ? env.REFRESH_REUSE_GRACE_MS + 10000 : 0)),
    });
    if (scenario === 'inactive') mockMethod(t, prisma.user, 'findUnique', async () => ({ ...user, activo: false }));
    const update = mockMethod(t, prisma.session, 'updateMany', async () => ({ count: scenario === 'race' ? 0 : 1 }));
    const result = await invoke(refresh, request({ refreshToken: token }));
    if (scenario === 'rotate') {
      assert.ifError(result.error);
      assert.notEqual(result.body.data.refreshToken, token);
      assert.equal(jwt.verify(result.body.data.token, env.JWT_SECRET).sid, '8');
      const args = update.mock.calls[0].arguments[0];
      assert.equal(args.where.tokenHash, digest);
      assert.equal(args.data.refreshHash, digest);
      assert.equal(args.data.tokenHash, hashToken(result.body.data.refreshToken));
    } else {
      assert.equal(result.error.statusCode, 401);
      if (scenario === 'reuse') assert.deepEqual(update.mock.calls[0].arguments[0], { where: { id: 8n, revocada: false }, data: { revocada: true } });
      if (['missing', 'inactive', 'grace'].includes(scenario)) assert.equal(update.mock.callCount(), 0);
    }
  });
}

test('logout revoca solo la sesión del usuario autenticado', async t => {
  setup(t);
  const result = await invoke(logout, request());
  assert.ifError(result.error);
  assert.equal(result.body.data.loggedOut, true);
  const args = prisma.session.updateMany.mock.calls[0].arguments[0];
  assert.equal(args.where.usuarioId, 12n);
  assert.equal(args.where.id, 8n);
  assert.equal(args.data.revocada, true);
});

test('changePassword guarda un hash y revoca las otras sesiones', async t => {
  setup(t);
  mockMethod(t, bcrypt, 'compare', async () => true);
  const hash = mockMethod(t, bcrypt, 'hash', async () => 'new-hash');
  const update = mockMethod(t, prisma.user, 'update', async () => user);
  const result = await invoke(changePassword, request({ currentPassword: 'fixture-current', newPassword: 'Fixture-New-2026!' }));
  assert.ifError(result.error);
  assert.equal(hash.mock.calls[0].arguments[1], 12);
  assert.deepEqual(update.mock.calls[0].arguments[0], { where: { id: 12n }, data: { passwordHash: 'new-hash' } });
  const scope = prisma.session.updateMany.mock.calls[0].arguments[0].where;
  assert.equal(scope.usuarioId, 12n);
  assert.deepEqual(scope.id, { not: 8n });
});

for (const missing of [true, false]) {
  test(`changePassword rechaza ${missing ? 'usuario inexistente' : 'contraseña incorrecta'}`, async t => {
    setup(t);
    mockMethod(t, prisma.user, 'findUnique', async () => missing ? null : user);
    mockMethod(t, bcrypt, 'compare', async () => false);
    const update = mockMethod(t, prisma.user, 'update', async () => { throw new Error('must not update'); });
    const result = await invoke(changePassword, request({ currentPassword: 'fixture-current', newPassword: 'Fixture-New-2026!' }));
    assert.equal(result.error.statusCode, missing ? 404 : 401);
    assert.equal(update.mock.callCount(), 0);
  });
}

test('logout propaga fallo de persistencia sin anunciar éxito', async t => {
  setup(t);
  const failure = new Error('session write failed');
  mockMethod(t, prisma.session, 'updateMany', async () => { throw failure; });
  const result = await invoke(logout, request());
  assert.equal(result.error, failure);
  assert.equal(result.body, undefined);
});
