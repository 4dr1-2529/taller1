#!/usr/bin/env node
/** Guardia de arranque: el script legacy de población se detiene antes de ejecutar su cuerpo. */
function assertLegacyDemoPopulationDisabled() {
  throw new Error("Legacy demo population disabled. Use the approved Data Seed V2 workflow.");
}
assertLegacyDemoPopulationDisabled();
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { requireDemoPassword } from "./demo-env.mjs";

const password = process.argv[2] ?? requireDemoPassword();
const prisma = new PrismaClient();

try {
  const hash = await bcrypt.hash(password, 12);
  const result = await prisma.user.updateMany({ data: { passwordHash: hash } });
  console.log(`OK — ${result.count} usuario(s) con nueva contraseña.`);
} finally {
  await prisma.$disconnect();
}
