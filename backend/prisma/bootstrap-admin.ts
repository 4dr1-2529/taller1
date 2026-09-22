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
  const nombres = process.env.ADMIN_NOMBRES?.trim();
  const apellidos = process.env.ADMIN_APELLIDOS?.trim();

  if (!email || !password || password.length < 12 || !nombres || !apellidos) {
    console.error("Defina ADMIN_EMAIL, ADMIN_PASSWORD (mín. 12), ADMIN_NOMBRES y ADMIN_APELLIDOS.");
    process.exit(1);
  }

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) {
    console.error("Ya existe un usuario con ese correo.");
    process.exit(1);
  }

  const role = await prisma.role.findUnique({ where: { codigo: "admin" } });
  if (!role) throw new Error("No existe el rol admin. Ejecute primero db:seed:structure.");
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: hash,
      nombres,
      apellidos,
      rolId: role.id,
    },
  });

  console.log(`Administrador creado: ${user.email}`);
  console.log("Guarde la contraseña de forma segura. No se almacena en texto plano.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
