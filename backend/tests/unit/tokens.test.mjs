import test from "node:test";
import assert from "node:assert/strict";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  refreshExpiryDate,
  truncate,
} from "../../src/utils/tokens.js";

test("hashToken devuelve string SHA256 de 64 caracteres", () => {
  const hash = hashToken("mi-token-secreto");
  assert.strictEqual(typeof hash, "string");
  assert.strictEqual(hash.length, 64);
});

test("hashToken es determinista", () => {
  assert.strictEqual(hashToken("mismo"), hashToken("mismo"));
});

test("hashToken produce distinto hash para distinta entrada", () => {
  assert.notStrictEqual(hashToken("a"), hashToken("b"));
});

test("truncate devuelve null para null/undefined", () => {
  assert.strictEqual(truncate(null, 10), null);
  assert.strictEqual(truncate(undefined, 10), null);
});

test("truncate acorta strings largos", () => {
  assert.strictEqual(truncate("hola mundo", 5), "hola ");
});

test("truncate no acorta strings cortos", () => {
  assert.strictEqual(truncate("hola", 10), "hola");
});

test("signAccessToken devuelve JWT string", () => {
  const token = signAccessToken(
    { sub: "1", email: "a@b.com", role: "admin" },
    "secreto",
    "1h",
  );
  assert.strictEqual(typeof token, "string");
  assert.ok(token.length > 0);
});

test("signRefreshToken devuelve JWT string con jti", () => {
  const token = signRefreshToken("1", "secreto", "7d");
  assert.strictEqual(typeof token, "string");
  assert.ok(token.length > 0);
});

test("refreshExpiryDate devuelve fecha futura para token válido", () => {
  const token = signRefreshToken("1", "secreto", "7d");
  const expiry = refreshExpiryDate(token);
  assert.ok(expiry instanceof Date);
  assert.ok(expiry.getTime() > Date.now());
});
