/**
 * SPRINT 2 — Autenticación, autorización y CONF-03.
 * Pruebas unitarias sin base de datos: se ejercitan los componentes puros
 * (authorize, alcances de sesión, regla de reportes) y las ramas previas a la
 * consulta de BD de `authenticate` (tokens inválidos/expirados). Los flujos
 * que requieren BD quedan registrados como bloqueados en el informe.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { authenticate, authorize } from "../src/middleware/auth.js";
import { env } from "../src/config/env.js";
import { signAccessToken } from "../src/utils/tokens.js";
import { resolveLogoutScope, resolvePasswordChangeScope } from "../src/utils/session-policy.js";
import { canDeleteReport } from "../src/controllers/reports.controller.js";
import { toDbId } from "../src/utils/ids.js";

type NextResult = { err?: unknown; called: boolean };

function callMw(mw: (req: Request, res: Response, next: NextFunction) => unknown, req: Partial<Request>): Promise<NextResult> {
  return new Promise((resolve) => {
    const out: NextResult = { called: false };
    const next = (err?: unknown) => {
      if (err) out.err = err;
      else out.called = true;
      resolve(out);
    };
    Promise.resolve(mw(req as Request, {} as Response, next)).catch(next);
  });
}

describe("authorize — matriz de roles", () => {
  const reqWith = (role: string | undefined) => ({
    user: role ? { sub: "1", email: "x@test", role } : undefined,
  }) as Partial<Request>;

  it("ruta admin: docente y estudiante reciben 403; admin pasa", async () => {
    const mw = authorize("admin");
    assert.equal((await callMw(mw, reqWith("admin") as Request)).called, true);
    const d = await callMw(mw, reqWith("docente") as Request);
    assert.equal((d.err as { statusCode?: number }).statusCode, 403);
    const e = await callMw(mw, reqWith("estudiante") as Request);
    assert.equal((e.err as { statusCode?: number }).statusCode, 403);
  });

  it("ruta admin|docente: estudiante recibe 403; admin y docente pasan", async () => {
    const mw = authorize("admin", "docente");
    assert.equal((await callMw(mw, reqWith("admin") as Request)).called, true);
    assert.equal((await callMw(mw, reqWith("docente") as Request)).called, true);
    const e = await callMw(mw, reqWith("estudiante") as Request);
    assert.equal((e.err as { statusCode?: number }).statusCode, 403);
  });

  it("ruta docente: admin NO obtiene acceso automático; estudiante 403", async () => {
    const mw = authorize("docente");
    assert.equal((await callMw(mw, reqWith("docente") as Request)).called, true);
    const a = await callMw(mw, reqWith("admin") as Request);
    assert.equal((a.err as { statusCode?: number }).statusCode, 403);
    const e = await callMw(mw, reqWith("estudiante") as Request);
    assert.equal((e.err as { statusCode?: number }).statusCode, 403);
  });

  it("sin usuario autenticado: 401", async () => {
    const r = await callMw(authorize("admin"), reqWith(undefined) as Request);
    assert.equal((r.err as { statusCode?: number }).statusCode, 401);
  });
});

describe("authenticate — rechazos previos a BD", () => {
  it("sin cabecera Authorization → 401 UNAUTHORIZED", async () => {
    const r = await callMw(authenticate, { headers: {} } as Partial<Request>);
    assert.equal((r.err as { statusCode?: number }).statusCode, 401);
    assert.equal((r.err as { code?: string }).code, "UNAUTHORIZED");
  });

  it("token basura → 401 (jwt.verify falla antes de tocar BD)", async () => {
    const r = await callMw(authenticate, { headers: { authorization: "Bearer no-es-un-jwt" } } as Partial<Request>);
    assert.equal((r.err as { statusCode?: number }).statusCode, 401);
    assert.equal((r.err as { code?: string }).code, "INVALID_TOKEN");
  });

  it("access token EXPIRADO → 401 (vencimiento verificado sin BD)", async () => {
    const expired = jwt.sign({ sub: "1", email: "a@b.c", role: "docente" }, env.JWT_SECRET, { expiresIn: -10 });
    const r = await callMw(authenticate, { headers: { authorization: `Bearer ${expired}` } } as Partial<Request>);
    assert.equal((r.err as { statusCode?: number }).statusCode, 401);
    assert.equal((r.err as { code?: string }).code, "INVALID_TOKEN");
  });

  it("token válido SIN rol → 401 INVALID_TOKEN antes de consultar BD", async () => {
    const noRole = jwt.sign({ sub: "1", email: "a@b.c" }, env.JWT_SECRET, { expiresIn: "5m" });
    const r = await callMw(authenticate, { headers: { authorization: `Bearer ${noRole}` } } as Partial<Request>);
    assert.equal((r.err as { statusCode?: number }).statusCode, 401);
    assert.equal((r.err as { code?: string }).code, "INVALID_TOKEN");
  });

  it("token de refresh NO sirve como access token (falta role → 401)", async () => {
    const refreshLike = jwt.sign({ sub: "1", type: "refresh" }, env.JWT_SECRET, { expiresIn: "7d" });
    const r = await callMw(authenticate, { headers: { authorization: `Bearer ${refreshLike}` } } as Partial<Request>);
    assert.equal((r.err as { statusCode?: number }).statusCode, 401);
  });
});

describe("signAccessToken — vinculación de sesión (sid)", () => {
  it("incluye el claim sid cuando se proporciona", () => {
    const token = signAccessToken({ sub: "10", email: "a@b.c", role: "docente", sid: "777" }, env.JWT_SECRET, "8h");
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sid?: string; role?: string };
    assert.equal(decoded.sid, "777");
    assert.equal(decoded.role, "docente");
  });

  it("omite el claim sid cuando no hay sesión (token legado)", () => {
    const token = signAccessToken({ sub: "10", email: "a@b.c", role: "admin" }, env.JWT_SECRET, "8h");
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sid?: string };
    assert.equal(decoded.sid, undefined);
    assert.equal("sid" in decoded, false);
  });

  it("el token firmado es verificable y expira según el TTL", () => {
    const token = signAccessToken({ sub: "1", email: "a@b.c", role: "estudiante", sid: "1" }, env.JWT_SECRET, "10m");
    const decoded = jwt.verify(token, env.JWT_SECRET) as { exp: number; iat: number };
    assert.equal(Math.round((decoded.exp - decoded.iat) / 60), 10);
  });
});

describe("resolveLogoutScope — alcance de revocación", () => {
  it("con sid: revoca SOLO la sesión actual", () => {
    const w = resolveLogoutScope("5", "777");
    assert.equal(w.usuarioId, toDbId("5"));
    assert.equal(w.revocada, false);
    assert.equal(w.id, toDbId("777"));
    assert.equal("tokenHash" in w, false);
  });

  it("con refresh token (legado sin sid): revoca esa sesión — vigente o ya rotado", () => {
    const w = resolveLogoutScope("5", undefined, "rt-abc");
    assert.equal(w.usuarioId, toDbId("5"));
    // SPRINT 5: el alcance acepta el refresh vigente (token_hash) y el
    // recién rotado (refresh_hash) — mismo token presentado en ambas ramas.
    assert.ok(Array.isArray(w.OR) && w.OR.length === 2);
    const [current, previous] = w.OR as { tokenHash?: string; refreshHash?: string }[];
    assert.ok(typeof current.tokenHash === "string" && current.tokenHash.length === 64);
    assert.ok(typeof previous.refreshHash === "string" && previous.refreshHash.length === 64);
    assert.equal(current.tokenHash, previous.refreshHash);
    assert.equal("id" in w, false);
  });

  it("sin sid ni refresh: todas las sesiones del MISMO usuario (base)", () => {
    const w = resolveLogoutScope("5");
    assert.equal(w.usuarioId, toDbId("5"));
    assert.equal(w.revocada, false);
    assert.equal(Object.keys(w).length, 2);
  });

  it("sid tiene prioridad sobre refreshToken", () => {
    const w = resolveLogoutScope("5", "777", "rt-abc");
    assert.equal(w.id, toDbId("777"));
    assert.equal("tokenHash" in w, false);
  });

  it("el alcance NUNCA depende de un usuario ajeno (siempre filtra por sub)", () => {
    for (const w of [resolveLogoutScope("5", "1"), resolveLogoutScope("5", undefined, "x"), resolveLogoutScope("5")]) {
      assert.equal(w.usuarioId, toDbId("5"));
    }
  });
});

describe("resolvePasswordChangeScope — revocación al cambiar contraseña", () => {
  it("con sid: revoca todas MENOS la actual", () => {
    const w = resolvePasswordChangeScope("5", "777");
    assert.equal(w.usuarioId, toDbId("5"));
    assert.deepEqual(w.id, { not: toDbId("777") });
    assert.equal(w.revocada, false);
  });

  it("sin sid: revoca todas (token legado)", () => {
    const w = resolvePasswordChangeScope("5");
    assert.equal("id" in w, false);
    assert.equal(w.usuarioId, toDbId("5"));
  });
});

describe("CONF-03 — canDeleteReport (regla de propiedad)", () => {
  it("admin puede eliminar reportes de cualquier usuario", () => {
    assert.equal(canDeleteReport("admin", "1", 999n), true);
    assert.equal(canDeleteReport("admin", "1", null), true);
  });

  it("docente solo sus propios reportes", () => {
    assert.equal(canDeleteReport("docente", "2", 2n), true);
    assert.equal(canDeleteReport("docente", "2", 3n), false);
    assert.equal(canDeleteReport("docente", "2", null), false);
  });

  it("estudiante no elimina reportes (ni siquiera con coincidencia numérica)", () => {
    assert.equal(canDeleteReport("estudiante", "2", 3n), false);
  });
});

describe("guardas estáticas — rutas y controladores", () => {
  const routes = readFileSync(new URL("../src/routes/index.ts", import.meta.url), "utf8");
  const authController = readFileSync(new URL("../src/controllers/auth.controller.ts", import.meta.url), "utf8");
  const messagesController = readFileSync(new URL("../src/controllers/messages.controller.ts", import.meta.url), "utf8");
  const authMiddleware = readFileSync(new URL("../src/middleware/auth.ts", import.meta.url), "utf8");

  it("DELETE /reports/:id exige admin", () => {
    assert.match(routes, /router\.delete\("\/reports\/:id",\s*authenticate,\s*authorize\("admin"\)/);
  });

  it("GET/POST /reports permiten admin y docente", () => {
    assert.match(routes, /router\.get\("\/reports",\s*authenticate,\s*authorize\("admin",\s*"docente"\)/);
    assert.match(routes, /router\.post\("\/reports",\s*authenticate,\s*authorize\("admin",\s*"docente"\)/);
  });

  it("login/refresh públicos; logout y change-password autenticados", () => {
    assert.match(routes, /router\.post\("\/auth\/login",\s*login\)/);
    assert.match(routes, /router\.post\("\/auth\/refresh",\s*refresh\)/);
    assert.match(routes, /router\.post\("\/auth\/logout",\s*authenticate,\s*logout\)/);
    assert.match(routes, /router\.post\("\/auth\/change-password",\s*authenticate,\s*changePassword\)/);
  });

  it("refresh exige sesión no revocada (reutilización de refresh revocado → 401)", () => {
    assert.match(authController, /revocada:\s*false/);
    assert.match(authController, /Sesión inválida o expirada/);
  });

  it("login y refresh emiten access tokens con sid", () => {
    assert.match(authController, /signAccessToken\(/);
    assert.equal((authController.match(/signAccessToken\(/g) ?? []).length, 2);
  });

  it("logout y cambio de contraseña usan la política de sesiones", () => {
    assert.match(authController, /resolveLogoutScope\(/);
    assert.match(authController, /resolvePasswordChangeScope\(/);
  });

  it("authenticate valida la sesión vinculada (sid) del access token", () => {
    assert.match(authMiddleware, /if \(decoded\.sid\)/);
    assert.match(authMiddleware, /revocada:\s*false/);
  });

  it("H-1: escritura en salas institucionales solo por admin", () => {
    assert.match(messagesController, /roomId === "global:institucional" \|\| roomId === "canal:profesores"/);
    assert.match(messagesController, /Solo el director puede publicar en esta sala/);
  });
});
