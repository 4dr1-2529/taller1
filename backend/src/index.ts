(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
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
    origin: env.CORS_ORIGIN,
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
  res.json({
    ok: true,
    service: "tesis-dashboard-api",
    version: "v1",
    basePath: "/api/v1",
  });
});

app.get("/api/v1", (_req, res) => {
  res.json({ ok: true, message: "Use /api/v1/auth/login, /api/v1/students, etc." });
});

app.use(
  "/api/v1",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes. Intente más tarde." },
  }),
  apiRoutes,
);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`API tesis-dashboard → http://localhost:${env.PORT}/api/v1`);
});

server.on("close", async () => {
  await gracefulShutdown();
});
