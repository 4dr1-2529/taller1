import { sendSuccess } from "./utils/response.js";
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env, corsOrigins } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sanitizeBody } from "./middleware/sanitize.js";
import apiRoutes from "./routes/index.js";
import { gracefulShutdown } from "./utils/prisma.js";

const app = express();

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production",
  crossOriginEmbedderPolicy: false,
}));
app.use(
  cors({
    origin(origin, callback) {
      const allowed = corsOrigins();
      if (!origin || allowed.includes(origin)) {
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

app.use(
  "/api/v1",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Demasiadas solicitudes. Intente más tarde.",
      errors: ["RATE_LIMIT"],
    },
  }),
  apiRoutes,
);

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
