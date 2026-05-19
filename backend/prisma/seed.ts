import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Tesis2026!", 10);

  const users: { email: string; role: UserRole; nombres: string; apellidos: string }[] = [
    { email: "admin@iep-huancayo.edu.pe", role: "admin", nombres: "Admin", apellidos: "Sistema" },
    { email: "docente@iep-huancayo.edu.pe", role: "docente", nombres: "Ana", apellidos: "Quispe" },
    { email: "tutor@iep-huancayo.edu.pe", role: "tutor", nombres: "Carlos", apellidos: "Rojas" },
    { email: "psicologo@iep-huancayo.edu.pe", role: "psicologo", nombres: "María", apellidos: "Torres" },
    { email: "estudiante@iep-huancayo.edu.pe", role: "estudiante", nombres: "Lucía", apellidos: "Paredes" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: hash },
    });
  }

  const t1 = await prisma.teacher.upsert({
    where: { codigo: "PR-001" },
    update: {},
    create: {
      codigo: "PR-001",
      nombres: "Ana",
      apellidos: "Quispe",
      especialidad: "Matemática",
      correo: "ana.quispe@colegio.edu.pe",
    },
  });
  const t2 = await prisma.teacher.upsert({
    where: { codigo: "PR-002" },
    update: {},
    create: {
      codigo: "PR-002",
      nombres: "Luis",
      apellidos: "Mendoza",
      especialidad: "Comunicación",
      correo: "luis.mendoza@colegio.edu.pe",
    },
  });

  const c1 = await prisma.course.upsert({
    where: { codigo: "CU-101" },
    update: {},
    create: { codigo: "CU-101", nombre: "Álgebra", nivel: "4to Secundaria", profesorId: t1.id },
  });
  const c2 = await prisma.course.upsert({
    where: { codigo: "CU-201" },
    update: {},
    create: { codigo: "CU-201", nombre: "Literatura", nivel: "5to Secundaria", profesorId: t2.id },
  });

  const s1 = await prisma.student.upsert({
    where: { codigo: "ST-001" },
    update: {},
    create: {
      codigo: "ST-001",
      nombres: "Lucía",
      apellidos: "Paredes",
      nivel: "4to Secundaria",
      correo: "lucia.paredes@colegio.edu.pe",
      promedioGeneral: 15.2,
      asistenciaGeneral: 92,
      lmsEngagement: "alto",
    },
  });
  const s2 = await prisma.student.upsert({
    where: { codigo: "ST-002" },
    update: {},
    create: {
      codigo: "ST-002",
      nombres: "Carlos",
      apellidos: "Rojas",
      nivel: "5to Secundaria",
      correo: "carlos.rojas@colegio.edu.pe",
      estado: "en_riesgo",
      promedioGeneral: 10.8,
      asistenciaGeneral: 68,
      lmsEngagement: "bajo",
    },
  });

  for (const [studentId, weeks] of [
    [s1.id, [72, 68, 75, 80]],
    [s2.id, [38, 32, 40, 35]],
  ] as const) {
    for (let i = 0; i < weeks.length; i++) {
      await prisma.lmsActivity.create({
        data: {
          studentId,
          semana: `Sem ${i + 1}`,
          actividadPct: weeks[i],
          minutos: weeks[i] * 2,
          tareasEntregadas: studentId === s1.id ? 9 : 4,
          tareasTotales: 10,
          horasPlataforma: weeks[i] / 20,
        },
      });
    }
  }

  await prisma.enrollment.upsert({
    where: { studentId_courseId_periodo: { studentId: s1.id, courseId: c1.id, periodo: "2026-I" } },
    update: {},
    create: { studentId: s1.id, courseId: c1.id, promedio: 15.5, asistenciaPct: 95 },
  });
  await prisma.enrollment.upsert({
    where: { studentId_courseId_periodo: { studentId: s2.id, courseId: c2.id, periodo: "2026-I" } },
    update: {},
    create: { studentId: s2.id, courseId: c2.id, promedio: 10.2, asistenciaPct: 70 },
  });

  await prisma.dashboardSnapshot.upsert({
    where: { periodo: "2026-I" },
    update: { riesgoGlobal: 43, totalEstudiantes: 2, alertasAbiertas: 1 },
    create: { periodo: "2026-I", riesgoGlobal: 43, totalEstudiantes: 2, alertasAbiertas: 1 },
  });

  const admin = await prisma.user.findUnique({
    where: { email: "admin@iep-huancayo.edu.pe" },
  });
  const tutor = await prisma.user.findUnique({ where: { email: "tutor@iep-huancayo.edu.pe" } });
  for (const u of [admin, tutor].filter(Boolean)) {
    await prisma.notification.create({
      data: {
        userId: u!.id,
        tipo: "alerta",
        titulo: "Alerta temprana activa",
        mensaje: "Hay estudiantes con riesgo medio/alto. Revise el módulo de predicción.",
      },
    });
  }

  if (admin) {
    await prisma.chatMessage.create({
      data: {
        roomId: "iep-huancayo-tutoria",
        senderId: admin.id,
        senderName: "Admin Sistema",
        senderRole: "admin",
        contenido:
          "Bienvenidos al canal de tutoría. Revisen las alertas de riesgo alto en el módulo de predicción.",
      },
    });
  }

  console.log("Seed OK — usuarios: admin/docente/tutor/psicologo/estudiante @iep-huancayo.edu.pe");
  console.log("Contraseña demo: Tesis2026!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
