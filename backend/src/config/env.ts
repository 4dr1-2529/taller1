import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default("8h"),
    PORT: z.coerce.number().default(4000),
    /** Orígenes permitidos separados por coma (ej. producción + preview Vercel). */
    CORS_ORIGIN: z.string().default("http://localhost:3029"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    ML_SERVICE_URL: z.string().url().default("http://localhost:5000"),
  })
  .parse(process.env);

export function corsOrigins(): string[] {
  return env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
