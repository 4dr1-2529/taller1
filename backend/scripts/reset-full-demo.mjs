/**
 * Limpia datos operativos/demo y deja solo la estructura institucional (seed.ts).
 * Uso: npm run db:reset:full
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function wipeDemoData() {
  console.log("Limpiando datos académicos y demo…");

  await prisma.messageRead.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.dashboardSnapshot.deleteMany();
  await prisma.auditLog.deleteMany();

  await prisma.alertaFactor.deleteMany();
  await prisma.alertaHistorial.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.prediccionFeatureSnapshot.deleteMany();
  await prisma.prediccionFactor.deleteMany();
  await prisma.aiRecommendation.deleteMany();
  await prisma.prediction.deleteMany();

  await prisma.lmsEntregaTarea.deleteMany();
  await prisma.lmsActivity.deleteMany();
  await prisma.lmsIndicadorEstudiante.deleteMany();
  await prisma.resumenAsistencia.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.academicHistory.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.horarioClase.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.studentApoderado.deleteMany();
  await prisma.apoderado.deleteMany();

  const students = await prisma.student.deleteMany();
  await prisma.course.deleteMany();
  await prisma.tutorSeccion.deleteMany();
  const teachers = await prisma.teacher.deleteMany();

  const demoRoles = await prisma.role.findMany({
    where: { codigo: { in: ["estudiante", "docente"] } },
    select: { id: true },
  });
  const demoRoleIds = demoRoles.map((r) => r.id);
  const users = await prisma.user.deleteMany({
    where: { rolId: { in: demoRoleIds } },
  });

  console.log(`  estudiantes eliminados: ${students.count}`);
  console.log(`  profesores eliminados: ${teachers.count}`);
  console.log(`  usuarios demo eliminados: ${users.count}`);
}

async function main() {
  await wipeDemoData();
  console.log("OK — base lista para db:seed + db:seed:demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
