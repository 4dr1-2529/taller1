/**
 * Limpia datos operativos/demo y deja solo la estructura institucional (seed.ts).
 * Uso: npm run db:reset:full
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assertDemoResetAllowed() {
  if (process.env.RESET_DEMO_DB !== "1") {
    throw new Error("Reset demo bloqueado: defina RESET_DEMO_DB=1 explícitamente.");
  }
  if (["production", "prod"].includes((process.env.NODE_ENV ?? "").toLowerCase())) {
    throw new Error("Reset demo bloqueado en producción.");
  }
}

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
  await prisma.teacherCourseAssignment.deleteMany();
  await prisma.tutorSeccion.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.studentApoderado.deleteMany();
  await prisma.apoderado.deleteMany();

  const students = await prisma.student.deleteMany();
  await prisma.course.deleteMany();
  const teachers = await prisma.teacher.deleteMany();

  const demoRoles = await prisma.role.findMany({
    where: { codigo: { in: ["admin", "docente", "estudiante"] } },
    select: { id: true },
  });
  const demoRoleIds = demoRoles.map((r) => r.id);
  const sessions = await prisma.session.deleteMany({
    where: { usuario: { rolId: { in: demoRoleIds } } },
  });
  const users = await prisma.user.deleteMany({
    where: { rolId: { in: demoRoleIds } },
  });

  console.log(`  estudiantes eliminados: ${students.count}`);
  console.log(`  profesores eliminados: ${teachers.count}`);
  console.log(`  sesiones eliminadas: ${sessions.count}`);
  console.log(`  usuarios demo eliminados: ${users.count}`);
}

async function main() {
  assertDemoResetAllowed();
  await wipeDemoData();
  console.log("OK — usuarios demo eliminados; schema, migraciones y estructura institucional conservados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
