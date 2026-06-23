#!/usr/bin/env node
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_INSTITUTION_PASSWORD } from "./default-password.mjs";

const password = process.argv[2] ?? DEFAULT_INSTITUTION_PASSWORD;
const prisma = new PrismaClient();

try {
  const hash = await bcrypt.hash(password, 12);
  const result = await prisma.user.updateMany({ data: { passwordHash: hash } });
  console.log(`OK — ${result.count} usuario(s) con nueva contraseña.`);
} finally {
  await prisma.$disconnect();
}
