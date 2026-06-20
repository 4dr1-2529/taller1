#!/usr/bin/env node
/**
 * Regenera migration.sql sin BOM UTF-8 y con defaults MySQL para updated_at.
 * Ejecutar desde backend/: node scripts/regenerate-init-migration.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");
const outPath = path.join(backendRoot, "prisma/migrations/20250609120000_init/migration.sql");

const sql = execSync(
  "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
  { cwd: backendRoot, encoding: "utf8" },
);

const fixed = sql
  .replace(/\uFEFF/g, "")
  .replace(
    /`updated_at` DATETIME\(3\) NOT NULL,/g,
    "`updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),",
  );

fs.writeFileSync(outPath, fixed, { encoding: "utf8" });
console.log(`✓ ${outPath} (${fixed.length} bytes, sin BOM)`);
