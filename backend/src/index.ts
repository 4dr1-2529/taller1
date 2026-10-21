import { sendSuccess } from "./utils/response.js";
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env, isCorsOriginAllowed } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sanitizeBody } from "./middleware/sanitize.js";
import apiRoutes from "./routes/index.js";
import { gracefulShutdown } from "./utils/prisma.js";
import { resolveTrustProxyHops, trustedClientIp } from "./middleware/trustProxy.js";
import { createAuthLimiter, createGlobalLimiter } from "./middleware/rateLimit.js";

const app = express();

// CONF-02: confianza mínima en el proxy según la topología verificada (Railway,
// 1 salto, X-Real-IP definido por el edge). Ver middleware/trustProxy.ts.
const trustProxyHops = resolveTrustProxyHops(process.env.NODE_ENV);
app.set("trust proxy", trustProxyHops);
if (trustProxyHops) {
  app.use(trustedClientIp());
}

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production",
  crossOriginEmbedderPolicy: false,
}));
app.use(
  cors({
    origin(origin, callback) {
      if (isCorsOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);

app.get("/", (_req, res) => {
  sendSuccess(res, { service: "tesis-dashboard-api",
    version: "v1",
    basePath: "/api/v1", });
});

app.get("/api/v1", (_req, res) => {
  sendSuccess(res, { message: "Use /api/v1/auth/login, /api/v1/students, etc." });
});

// H-1 (Sprint 4): limitador estricto por IP sobre las rutas que minten
// tokens. Complementa el bloqueo de 5 intentos fallidos por IP de
// auth.controller. Se monta antes del limitador global para que un flood de
// login no consuma el presupuesto general de la IP.
const authLimiter = createAuthLimiter();
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/refresh", authLimiter);
app.use("/api/v1/auth/change-password", authLimiter);

// H-1 (Sprint 4): backstop global por IP con presupuesto amplio (default
// 12000/15 min, configurable). El límite previo de 300/15 min lo agotaba una
// sola sesión interactiva intensiva (~350 req medidas en E2E) y, tras una IP
// compartida, castigaba a todos los usuarios con 429 en llamadas ordinarias.
app.use("/api/v1", createGlobalLimiter(), apiRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "tesis-dashboard-api" });
});

app.use(errorHandler);

const host = process.env.HOST ?? "0.0.0.0";
const server = app.listen(env.PORT, host, () => {
  console.log(`API tesis-dashboard → http://${host}:${env.PORT}/api/v1 (${env.NODE_ENV})`);
});

server.on("close", async () => {
  await gracefulShutdown();
});
