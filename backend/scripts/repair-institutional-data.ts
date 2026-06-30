/**
 * Repara cuentas de acceso y notas I–II sin borrar toda la base.
 * Uso: tsx scripts/repair-institutional-data.ts
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { repairBimesterGrades } from "../prisma/demo-data/seed-grades.js";
import {
  buildStudentAccountEmail,
} from "../src/utils/person-accounts.js";
import { getInstitutionDefaultPassword } from "../src/config/institution-password.js";

const prisma = new PrismaClient();

async function syncStudentAccounts() {
  const hash = await bcrypt.hash(getInstitutionDefaultPassword(), 12);
  const rol = await prisma.role.findUnique({ where: { codigo: "estudiante" } });
  if (!rol) throw new Error("Rol estudiante no encontrado");

  const students = await prisma.student.findMany({
    where: { activo: true },
    include: { usuario: true },
  });

  let linked = 0;
  let fixedEmail = 0;
  let passwords = 0;

  for (const s of students) {
    const dni = s.dni ?? "00000000";
    const loginEmail = buildStudentAccountEmail(s.nombres, s.apellidos, dni, s.email).toLowerCase();

    if (!s.usuario) {
      const user = await prisma.user.upsert({
        where: { email: loginEmail },
        update: {
          passwordHash: hash,
          rolId: rol.id,
          nombres: s.nombres,
          apellidos: s.apellidos,
          dni: s.dni,
          activo: true,
        },
        create: {
          email: loginEmail,
          passwordHash: hash,
          nombres: s.nombres,
          apellidos: s.apellidos,
          dni: s.dni,
          rolId: rol.id,
        },
      });
      await prisma.student.update({
        where: { id: s.id },
        data: { usuarioId: user.id, email: loginEmail },
      });
      linked++;
      continue;
    }

    if (s.usuario.email.toLowerCase() !== loginEmail) {
      const taken = await prisma.user.findUnique({ where: { email: loginEmail } });
      if (!taken || taken.id === s.usuario.id) {
        await prisma.user.update({
          where: { id: s.usuario.id },
          data: { email: loginEmail, activo: true },
        });
        await prisma.student.update({ where: { id: s.id }, data: { email: loginEmail } });
        fixedEmail++;
      }
    }

    await prisma.user.update({
      where: { id: s.usuarioId! },
      data: { passwordHash: hash, activo: true },
    });
    passwords++;
  }

  const teachers = await prisma.teacher.findMany({
    where: { activo: true },
    select: { usuarioId: true },
  });
  for (const t of teachers) {
    if (!t.usuarioId) continue;
    await prisma.user.update({
      where: { id: t.usuarioId },
      data: { passwordHash: hash, activo: true },
    });
  }

  await prisma.user.updateMany({ data: { passwordHash: hash } });

  console.log(`  Cuentas — enlazadas: ${linked} · correos corregidos: ${fixedEmail} · contraseñas: ${passwords + teachers.length}`);
}

async function main() {
  console.log("Reparando datos institucionales…");

  const anio = await prisma.anioLectivo.findFirst({ where: { anio: 2026 } });
  if (!anio) throw new Error("No hay año lectivo 2026");

  const periodos = await prisma.periodoAcademico.findMany({
    where: { anioLectivoId: anio.id, numero: { in: [1, 2] } },
    orderBy: { numero: "asc" },
  });

  await syncStudentAccounts();

  const repair = await repairBimesterGrades(prisma, anio.id, periodos.map((p) => p.id));
  console.log(`  Notas — ${repair.created} calificaciones nuevas · ${repair.missingBefore} huecos detectados`);
  console.log("OK — contraseña institucional sincronizada (DEMO_PASSWORD)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
