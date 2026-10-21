import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { applyEnvAliases } from "./env-aliases.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

applyEnvAliases(process.env);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("8h"),
  PORT: z.coerce.number().default(4000),
  /** Orígenes permitidos separados por coma (ej. producción + preview Vercel). */
  CORS_ORIGIN: z.string().default("http://localhost:3029"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ML_SERVICE_URL: z.string().url().default("http://localhost:5000"),
  /** Rate limiting (H-1, Sprint 4): ventana compartida por los limitadores. */
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  /**
   * Backstop global por IP. Default amplio a propósito: el uso normal
   * intensivo mide ~350 req/ventana (E2E Sprint 3) y una IP de plantel
   * (NAT) agrupa a muchos usuarios; 12000/15 min ≈ 13 req/s por IP sigue
   * acotando inundaciones sin penalizar sesiones legítimas.
   */
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(12000),
  /**
   * Login/refresh/change-password por IP: defensa en profundidad junto al
   * bloqueo de 5 intentos fallidos de auth.controller. Generoso para no
   * penalizar la oleada matinal de un plantel detrás de una misma IP.
   */
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error(
    [
      "Configuración de entorno inválida:",
      details,
      "",
      "Railway: use JWT_SECRET (≥32 caracteres), DATABASE_URL, NODE_ENV=production.",
      "No use JWT_SECRETO ni ENTORNO_NODO=producción.",
    ].join("\n"),
  );
  process.exit(1);
}

export const env = parsed.data;

export function corsOrigins(): string[] {
  return env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** Permite *, lista exacta y subdominios *.vercel.app si hay algún origen vercel.app. */
export function isCorsOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;

  const allowed = corsOrigins();
  if (allowed.includes("*")) return true;
  if (allowed.includes(origin)) return true;

  const allowsVercel = allowed.some((o) => o.includes(".vercel.app"));
  if (allowsVercel && /^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) {
    return true;
  }

  return false;
}
