#!/usr/bin/env node
/**
 * Recuperación manual P3009 — ver scripts/p3009-recovery.mjs
 * Uso: DATABASE_URL=... npm run db:railway:fix-p3009
 */
import { recoverFailedInitMigration } from "./p3009-recovery.mjs";
import { prismaExecOrThrow } from "./prisma-exec.mjs";

if (!process.env.DATABASE_URL) {
  console.error("ERROR: defina DATABASE_URL.");
  process.exit(1);
}

console.log("=== Recuperación Prisma P3009 ===\n");
recoverFailedInitMigration();
prismaExecOrThrow(["generate"]);

console.log("\n✓ Listo. Redeploy o npm run start:prod");
console.log("\nSeed opcional:");
console.log("  npm run db:seed");
console.log("  npm run db:seed:demo");
console.log("  ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:bootstrap");
