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
