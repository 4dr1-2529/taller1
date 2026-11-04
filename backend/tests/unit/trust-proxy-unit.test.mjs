import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveTrustProxyHops,
  trustedClientIp,
} from "../../src/middleware/trustProxy.js";

test("resolveTrustProxyHops confía en un solo salto en producción", () => {
  assert.strictEqual(resolveTrustProxyHops("production"), 1);
});

test("resolveTrustProxyHops no confía en proxy fuera de producción", () => {
  assert.strictEqual(resolveTrustProxyHops("development"), false);
  assert.strictEqual(resolveTrustProxyHops(undefined), false);
  assert.strictEqual(resolveTrustProxyHops("test"), false);
});

test("trustedClientIp promueve X-Real-IP cuando es una IP válida", () => {
  const req = { get: (name) => (name === "X-Real-IP" ? "203.0.113.50" : undefined), ip: undefined };
  let nextCalled = false;
  trustedClientIp()(req, {}, () => { nextCalled = true; });
  assert.strictEqual(req.ip, "203.0.113.50");
  assert.strictEqual(nextCalled, true);
});

test("trustedClientIp no promueve una cabecera inválida", () => {
  const req = { get: () => "no-es-una-ip", ip: "127.0.0.1" };
  trustedClientIp()(req, {}, () => {});
  assert.strictEqual(req.ip, "127.0.0.1");
});

test("trustedClientIp no falla si falta la cabecera", () => {
  const req = { get: () => undefined, ip: "127.0.0.1" };
  let nextCalled = false;
  trustedClientIp()(req, {}, () => { nextCalled = true; });
  assert.strictEqual(req.ip, "127.0.0.1");
  assert.strictEqual(nextCalled, true);
});
