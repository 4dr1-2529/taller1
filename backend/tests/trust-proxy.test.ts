/**
 * CONF-02 — Pruebas de confianza en el proxy y rate limiting por IP real.
 * Usa IPs y cabeceras simuladas contra servidores efímeros en 127.0.0.1.
 * No toca base de datos, ni artefactos, ni la red externa.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import type { Server } from "node:http";
import express from "express";
import rateLimit from "express-rate-limit";
import { resolveTrustProxyHops, trustedClientIp } from "../src/middleware/trustProxy.js";

type JsonResponse = { status: number; body: Record<string, unknown> };

async function listen(app: express.Express): Promise<Server> {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server;
}

function close(server: Server): void {
  server.closeAllConnections?.();
  server.close();
}

async function request(server: Server, path: string, headers: Record<string, string> = {}): Promise<JsonResponse> {
  const port = (server.address() as { port: number }).port;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { headers });
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    // sin cuerpo JSON (p. ej. 429 en texto)
  }
  return { status: res.status, body };
}

/** Réplica de la app en topología de producción: trust proxy=1 + X-Real-IP del edge. */
function productionLikeApp(): express.Express {
  const app = express();
  app.set("trust proxy", resolveTrustProxyHops("production"));
  app.use(trustedClientIp());
  app.get("/ip", (_req, res) => {
    res.json({ ip: _req.ip });
  });
  return app;
}

describe("CONF-02 trust proxy (topología Railway verificada)", () => {
  it("resuelve 1 salto confiable solo en producción", () => {
    assert.equal(resolveTrustProxyHops("production"), 1);
    assert.equal(resolveTrustProxyHops("development"), false);
    assert.equal(resolveTrustProxyHops("test"), false);
    assert.equal(resolveTrustProxyHops(undefined), false);
  });

  it("promueve el X-Real-IP definido por el edge a req.ip", async () => {
    const server = await listen(productionLikeApp());
    try {
      const r = await request(server, "/ip", { "X-Real-IP": "198.51.100.9" });
      assert.equal(r.body.ip, "198.51.100.9");
    } finally {
      close(server);
    }
  });

  it("ignora X-Real-IP que no sea una IP válida y usa el último salto confiable de XFF", async () => {
    const server = await listen(productionLikeApp());
    try {
      const r = await request(server, "/ip", {
        "X-Real-IP": "no-es-ip",
        "X-Forwarded-For": "203.0.113.50",
      });
      assert.equal(r.body.ip, "203.0.113.50");
    } finally {
      close(server);
    }
  });

  it("la cadena X-Forwarded-For falsificada por el cliente no altera req.ip", async () => {
    const server = await listen(productionLikeApp());
    try {
      const a = await request(server, "/ip", { "X-Real-IP": "198.51.100.9", "X-Forwarded-For": "6.6.6.6" });
      const b = await request(server, "/ip", {
        "X-Real-IP": "198.51.100.9",
        "X-Forwarded-For": "7.7.7.7, 8.8.8.8",
      });
      assert.equal(a.body.ip, "198.51.100.9");
      assert.equal(b.body.ip, "198.51.100.9");
    } finally {
      close(server);
    }
  });

  it("dos clientes reales detrás del mismo proxy reciben buckets de rate limit independientes", async () => {
    const app = productionLikeApp();
    app.use(
      "/api",
      rateLimit({
        windowMs: 60_000,
        max: 2,
        standardHeaders: false,
        legacyHeaders: false,
        validate: false,
        message: { limited: true },
      }),
    );
    app.get("/api/ping", (_req, res) => {
      res.json({ ok: true });
    });
    const server = await listen(app);
    try {
      const clientA = { "X-Real-IP": "198.51.100.9", "X-Forwarded-For": "10.0.0.1, 198.51.100.9" };
      const clientB = { "X-Real-IP": "198.51.100.10", "X-Forwarded-For": "10.0.0.2, 198.51.100.10" };
      assert.equal((await request(server, "/api/ping", clientA)).status, 200);
      assert.equal((await request(server, "/api/ping", clientA)).status, 200);
      assert.equal((await request(server, "/api/ping", clientA)).status, 429); // agota su propio bucket
      assert.equal((await request(server, "/api/ping", clientB)).status, 200); // no hereda el bloqueo
      assert.equal((await request(server, "/api/ping", clientB)).status, 200);
    } finally {
      close(server);
    }
  });

  it("regresión del defecto original: sin confianza en el proxy todos comparten bucket", async () => {
    const app = express();
    app.set("trust proxy", false);
    app.use(
      "/api",
      rateLimit({
        windowMs: 60_000,
        max: 1,
        standardHeaders: false,
        legacyHeaders: false,
        validate: false,
        message: { limited: true },
      }),
    );
    app.get("/api/ping", (_req, res) => {
      res.json({ ok: true });
    });
    const server = await listen(app);
    try {
      const clientA = { "X-Real-IP": "198.51.100.9", "X-Forwarded-For": "198.51.100.9" };
      const clientB = { "X-Real-IP": "198.51.100.10", "X-Forwarded-For": "198.51.100.10" };
      assert.equal((await request(server, "/api/ping", clientA)).status, 200);
      // cliente B bloqueado por compartir la IP del proxy con A (el defecto CONF-02)
      assert.equal((await request(server, "/api/ping", clientB)).status, 429);
    } finally {
      close(server);
    }
  });

  it("guarda estática: index.ts aplica trust proxy acotado y el middleware X-Real-IP", () => {
    const src = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
    assert.match(src, /app\.set\(\s*"trust proxy"/);
    assert.match(src, /trustedClientIp\(\)/);
    assert.doesNotMatch(src, /app\.set\(\s*"trust proxy"\s*,\s*true\s*\)/);
  });

  it("guarda estática: el bloqueo de login y el audit log usan req.ip", () => {
    const auth = readFileSync(new URL("../src/controllers/auth.controller.ts", import.meta.url), "utf8");
    assert.match(auth, /req\.ip/);
  });
});
