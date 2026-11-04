import test from "node:test";
import assert from "node:assert/strict";
import { hashToken } from "../../src/utils/tokens.js";
import {
  resolveLogoutScope,
  resolvePasswordChangeScope,
} from "../../src/utils/session-policy.js";

const userSub = "42";

test("resolveLogoutScope con sid revoca solo la sesión actual", () => {
  const scope = resolveLogoutScope(userSub, "7");
  assert.deepStrictEqual(scope, {
    usuarioId: 42n,
    revocada: false,
    id: 7n,
  });
});

test("resolveLogoutScope con refresh token expone ambos hashes", () => {
  const scope = resolveLogoutScope(userSub, undefined, "refresh-token-x");
  assert.deepStrictEqual(scope, {
    usuarioId: 42n,
    revocada: false,
    OR: [{ tokenHash: hashToken("refresh-token-x") }, { refreshHash: hashToken("refresh-token-x") }],
  });
});

test("resolveLogoutScope sin identificadores revoca todas las sesiones del usuario", () => {
  const scope = resolveLogoutScope(userSub);
  assert.deepStrictEqual(scope, { usuarioId: 42n, revocada: false });
});

test("resolveLogoutScope ignora sid vacío", () => {
  const scope = resolveLogoutScope(userSub, "");
  assert.deepStrictEqual(scope, { usuarioId: 42n, revocada: false });
});

test("resolvePasswordChangeScope con sid conserva la sesión actual", () => {
  const scope = resolvePasswordChangeScope(userSub, "3");
  assert.deepStrictEqual(scope, {
    usuarioId: 42n,
    revocada: false,
    id: { not: 3n },
  });
});

test("resolvePasswordChangeScope sin sid revoca todas las sesiones", () => {
  const scope = resolvePasswordChangeScope(userSub);
  assert.deepStrictEqual(scope, { usuarioId: 42n, revocada: false });
});


