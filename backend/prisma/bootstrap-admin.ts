/**
 * Crea el primer usuario administrador (única vez).
 * ADMIN_EMAIL=admin@mi-colegio.edu.pe ADMIN_PASSWORD=TuClaveSegura123! npm run db:bootstrap
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 8) {
    console.error("Defina ADMIN_EMAIL y ADMIN_PASSWORD (mín. 8 caracteres).");
    process.exit(1);
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) {
    console.error("Ya existe un usuario con ese correo.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: hash,
      nombres: process.env.ADMIN_NOMBRES ?? "Administrador",
      apellidos: process.env.ADMIN_APELLIDOS ?? "Sistema",
      role: "admin",
    },
  });

  console.log(`Administrador creado: ${user.email}`);
  console.log("Guarde la contraseña de forma segura. No se almacena en texto plano.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
