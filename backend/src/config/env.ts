import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default("8h"),
    PORT: z.coerce.number().default(4000),
    CORS_ORIGIN: z.string().default("http://localhost:3029"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    ML_SERVICE_URL: z.string().url().default("http://localhost:5000"),
  })
  .parse(process.env);
