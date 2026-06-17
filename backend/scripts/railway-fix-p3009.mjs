#!/usr/bin/env node
/**
 * Recuperación P3009 en Railway MySQL (BD vacía o solo datos de prueba).
 *
 * Uso:
 *   cd backend
 *   set DATABASE_URL=mysql://user:pass@acela.proxy.rlwy.net:34678/railway
 *   npm run db:railway:fix-p3009
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");
const sqlPath = path.join(__dirname, "railway-drop-all-tables.sql");
const migrationName = "20250609120000_init";

if (!process.env.DATABASE_URL) {
  console.error("ERROR: defina DATABASE_URL (proxy TCP Railway o URL del plugin MySQL).");
  process.exit(1);
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: backendRoot, env: process.env });
}

console.log("=== Recuperación Prisma P3009 ===\n");

console.log(`1/4 migrate resolve --rolled-back "${migrationName}"`);
try {
  run(`npx prisma migrate resolve --rolled-back "${migrationName}"`);
} catch {
  console.warn("   (sin registro fallido o ya resuelto; continúa)");
}

console.log("\n2/4 eliminar tablas parciales vía Prisma db execute");
const dropSql = fs.readFileSync(sqlPath, "utf8");
const dropFile = path.join(backendRoot, ".railway-drop-temp.sql");
fs.writeFileSync(dropFile, dropSql, "utf8");
try {
  run(`npx prisma db execute --file "${dropFile}" --schema prisma/schema.prisma`);
  console.log("   tablas eliminadas");
} catch (err) {
  console.warn("   db execute falló; ejecute manualmente:", sqlPath);
} finally {
  fs.unlinkSync(dropFile);
}

console.log("\n3/4 prisma generate");
run("npx prisma generate");

console.log("\n4/4 prisma migrate deploy");
run("npx prisma migrate deploy");

console.log("\n✓ Migración aplicada. Opcional:");
console.log("   npm run db:seed");
console.log("   npm run db:seed:demo");
console.log("   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:bootstrap");
