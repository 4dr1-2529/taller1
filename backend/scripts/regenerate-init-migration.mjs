#!/usr/bin/env node
/**
 * Regenera migration.sql sin BOM UTF-8 y con defaults MySQL para updated_at.
 * Ejecutar desde backend/: node scripts/regenerate-init-migration.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { backendRoot, prismaExecOrThrow } from "./prisma-exec.mjs";

const outPath = path.join(backendRoot, "prisma/migrations/20250609120000_init/migration.sql");

const { stdout: sql } = prismaExecOrThrow(
  ["migrate", "diff", "--from-empty", "--to-schema-datamodel", "prisma/schema.prisma", "--script"],
  { stdio: "pipe" },
);

const fixed = sql
  .replace(/\uFEFF/g, "")
  .replace(
    /`updated_at` DATETIME\(3\) NOT NULL,/g,
    "`updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),",
  );

fs.writeFileSync(outPath, fixed, { encoding: "utf8" });
console.log(`✓ ${outPath} (${fixed.length} bytes, sin BOM)`);
