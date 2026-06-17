#!/usr/bin/env node
/**
 * Recuperación P3009 — migración fallida en Railway MySQL.
 *
 * Uso (desde backend/, con DATABASE_URL de Railway):
 *   node scripts/railway-fix-p3009.mjs
 *
 * ADVERTENCIA: borra TODAS las tablas. Solo usar si la BD no tiene datos importantes.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, "railway-drop-all-tables.sql");

if (!process.env.DATABASE_URL) {
  console.error("Defina DATABASE_URL (Railway MySQL) antes de continuar.");
  process.exit(1);
}

console.log("Paso 1/3: marcar migración fallida como rolled-back...");
try {
  execSync('npx prisma migrate resolve --rolled-back "20250609120000_init"', {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
} catch {
  console.warn("  (resolve puede fallar si no hay registro fallido; continúe si la BD está vacía)");
}

console.log("\nPaso 2/3: eliminar tablas parciales...");
console.log("  Ejecute el SQL en Railway MySQL:");
console.log(`  ${sqlPath}`);
console.log("  O desde Railway CLI: railway run -- mysql ... < scripts/railway-drop-all-tables.sql");

console.log("\nPaso 3/3: aplicar migraciones...");
try {
  execSync("npx prisma migrate deploy", { stdio: "inherit", cwd: path.join(__dirname, "..") });
  console.log("\n✓ Migraciones aplicadas.");
} catch (err) {
  console.error("\nSi falló, conecte a MySQL, ejecute railway-drop-all-tables.sql y vuelva a correr:");
  console.error("  npx prisma migrate deploy");
  process.exit(1);
}

if (fs.existsSync(sqlPath)) {
  console.log("\nSeed opcional:");
  console.log("  npm run db:seed");
  console.log("  npm run db:seed:demo");
  console.log("  ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:bootstrap");
}
