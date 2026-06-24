import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const students = await prisma.student.count();
  const teachers = await prisma.teacher.count({ where: { activo: true } });
  console.log(JSON.stringify({ ok: true, students, teachers }));
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: String(e) }));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
