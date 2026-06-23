import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash("mbappe29", 12);
  const rol = await prisma.role.findUnique({ where: { codigo: "admin" } });
  if (!rol) throw new Error("Rol admin no encontrado — ejecute npm run db:seed");

  for (const email of ["director@iep-huancayo.edu.pe", "admin@iep-huancayo.edu.pe"]) {
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash: hash, rolId: rol.id, activo: true },
      create: {
        email,
        passwordHash: hash,
        nombres: "Carlos",
        apellidos: "Ramírez Vargas",
        rolId: rol.id,
      },
    });
    console.log("OK", email);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
