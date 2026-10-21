/**
 * SPRINT 2 / FASE 5 — Manejo de 401/403 en el cliente HTTP (CONF-13).
 * Se ejercita ApiClient con `fetch` simulado: renovación single-flight,
 * reintento único por petición, exclusiones de /auth/* y propagación del
 * status en ApiError. Sin DOM ni red real.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { api, ApiError, setUnauthorizedHandler } from "../src/services/api";

const realFetch = globalThis.fetch;

function makeRes(status: number, body: unknown, contentType = "application/json"): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? contentType : null) },
    json: async () => body,
  } as unknown as Response;
}

const okBody = { success: true, data: { items: [1, 2] } };
const unauthorizedBody = { success: false, message: "Token inválido o expirado" };

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push(String(url));
    return handler(String(url), init);
  }) as typeof fetch;
  return calls;
}

test.afterEach(() => {
  globalThis.fetch = realFetch;
  setUnauthorizedHandler(null);
});

test("401 con handler que renueva: reintenta UNA vez y devuelve los datos", async () => {
  let first = true;
  const calls = mockFetch(() => {
    if (first) {
      first = false;
      return makeRes(401, unauthorizedBody);
    }
    return makeRes(200, okBody);
  });
  let renewals = 0;
  setUnauthorizedHandler(async () => {
    renewals += 1;
    return true;
  });

  const data = await api.call<{ items: number[] }>("/students");
  assert.deepEqual(data.items, [1, 2]);
  assert.equal(renewals, 1);
  assert.equal(calls.length, 2);
});

test("401 con handler que NO renueva: lanza ApiError con status 401 (sin reintento)", async () => {
  const calls = mockFetch(() => makeRes(401, unauthorizedBody));
  setUnauthorizedHandler(async () => false);

  const err = await api.call("/students").catch((e: unknown) => e);
  assert.ok(err instanceof ApiError);
  assert.equal(err.status, 401);
  assert.match(err.message, /Token inválido o expirado/);
  assert.equal(calls.length, 1);
});

test("401 sin handler registrado: lanza ApiError 401 directamente", async () => {
  const calls = mockFetch(() => makeRes(401, unauthorizedBody));

  const err = await api.call("/students").catch((e: unknown) => e);
  assert.ok(err instanceof ApiError);
  assert.equal(err.status, 401);
  assert.equal(calls.length, 1);
});

test("401 en /auth/refresh NO dispara la renovación (sin bucles de refresh)", async () => {
  const calls = mockFetch(() => makeRes(401, unauthorizedBody));
  let renewals = 0;
  setUnauthorizedHandler(async () => {
    renewals += 1;
    return true;
  });

  const err = await api.refreshToken("rt-vencido").catch((e: unknown) => e);
  assert.ok(err instanceof ApiError);
  assert.equal(err.status, 401);
  assert.equal(renewals, 0);
  assert.equal(calls.length, 1);
});

test("401 en /auth/login tampoco dispara la renovación", async () => {
  const calls = mockFetch(() => makeRes(401, { success: false, message: "Credenciales incorrectas" }));
  let renewals = 0;
  setUnauthorizedHandler(async () => {
    renewals += 1;
    return true;
  });

  const err = await api.login("a@b.c", "mala").catch((e: unknown) => e);
  assert.ok(err instanceof ApiError);
  assert.equal(err.status, 401);
  assert.equal(renewals, 0);
  assert.equal(calls.length, 1);
});

test("reintento único: si el token renovado también da 401, NO hay bucle", async () => {
  const calls = mockFetch(() => makeRes(401, unauthorizedBody));
  let renewals = 0;
  setUnauthorizedHandler(async () => {
    renewals += 1;
    return true;
  });

  const err = await api.call("/students").catch((e: unknown) => e);
  assert.ok(err instanceof ApiError);
  assert.equal(err.status, 401);
  assert.equal(renewals, 1);
  assert.equal(calls.length, 2);
});

test("single-flight: 401 concurrentes comparten UNA sola renovación", async () => {
  // Dos peticiones concurrentes reciben 401; tras renovar, ambas tienen éxito.
  let phase = 0;
  globalThis.fetch = (async () => {
    phase += 1;
    await new Promise((r) => setTimeout(r, 5));
    return phase <= 2 ? makeRes(401, unauthorizedBody) : makeRes(200, okBody);
  }) as typeof fetch;
  let renewals = 0;
  setUnauthorizedHandler(async () => {
    renewals += 1;
    await new Promise((r) => setTimeout(r, 10));
    return true;
  });

  const [a, b] = await Promise.all([
    api.call<{ items: number[] }>("/students"),
    api.call<{ items: number[] }>("/matriculas"),
  ]);
  assert.deepEqual(a.items, [1, 2]);
  assert.deepEqual(b.items, [1, 2]);
  assert.equal(renewals, 1);
  assert.equal(phase, 4);
});

test("403 se propaga como ApiError con status 403 y el mensaje del backend", async () => {
  mockFetch(() => makeRes(403, { success: false, message: "Permiso denegado" }));

  const err = await api.call("/admin/users").catch((e: unknown) => e);
  assert.ok(err instanceof ApiError);
  assert.equal(err.status, 403);
  assert.match(err.message, /Permiso denegado/);
});

test("éxito 200: el envoltorio data se extrae igual que antes (sin regresión)", async () => {
  mockFetch(() => makeRes(200, okBody));
  const data = await api.call<{ items: number[] }>("/students");
  assert.deepEqual(data.items, [1, 2]);
});

test("500 conserva el mensaje HTML-friendly existente", async () => {
  mockFetch(() =>
    makeRes(503, "<html>bad gateway</html>", "text/html"),
  );
  const err = await api.call("/students").catch((e: unknown) => e);
  assert.ok(err instanceof Error);
  assert.match(err.message, /Servidor no disponible \(HTTP 503\)/);
});

test("guardas estáticas: AuthProvider registra el handler y la página valida la sesión", () => {
  const authProvider = readFileSync(new URL("../src/contexts/AuthProvider.tsx", import.meta.url), "utf8");
  assert.match(authProvider, /(?<!api\.)setUnauthorizedHandler\(async/);
  assert.match(authProvider, /api\.refreshToken\(rt\)/);

  const page = readFileSync(new URL("../src/app/(shell)/page.tsx", import.meta.url), "utf8");
  assert.match(page, /if \(authLoading \|\| !user \|\| !role\)/);
});
