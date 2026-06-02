/**
 * Datos de prueba para sustentación y QA.
 * Ejecutar después de: npm run db:push && npm run db:seed
 * Comando: npm run db:seed:demo
 */
import { PrismaClient, RiskLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Tesis2026!";
const PERIODO = "2026-I";

async function main() {
  console.log("Seed demo — director, profesores, estudiantes, cursos, predicciones...");
  const hash = await bcrypt.hash(PASSWORD, 12);

  const director = await prisma.user.upsert({
    where: { email: "director@iep-huancayo.edu.pe" },
    update: {},
    create: {
      email: "director@iep-huancayo.edu.pe",
      passwordHash: hash,
      nombres: "Carlos",
      apellidos: "Ramírez",
      role: "admin",
    },
  });

  const seccion = await prisma.seccion.findFirst({
    where: { nombre: "A", grado: { numero: 3 } },
    include: { grado: true },
  });
  if (!seccion) {
    console.error("Ejecute primero npm run db:seed (estructura académica).");
    process.exit(1);
  }

  const catalogo = await prisma.cursoCatalogo.findFirst({ where: { codigo: "MAT-P" } });
  const teachers: { userId: string; teacherId: string }[] = [];

  for (let i = 1; i <= 5; i++) {
    const email = `profesor${i}@iep-huancayo.edu.pe`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hash,
        nombres: `Profesor${i}`,
        apellidos: `Demo`,
        role: "docente",
      },
    });
    const teacher = await prisma.teacher.upsert({
      where: { codigo: `DOC-00${i}` },
      update: { userId: user.id },
      create: {
        userId: user.id,
        codigo: `DOC-00${i}`,
        nombres: `Profesor${i}`,
        apellidos: `Demo`,
        especialidad: "Matemática",
        correo: email,
      },
    });
    teachers.push({ userId: user.id, teacherId: teacher.id });
  }

  const courses: string[] = [];
  for (let i = 0; i < 10; i++) {
    const prof = teachers[i % teachers.length];
    const course = await prisma.course.upsert({
      where: { codigo: `CUR-DEMO-${i + 1}` },
      update: {},
      create: {
        codigo: `CUR-DEMO-${i + 1}`,
        nombre: `Curso demo ${i + 1}`,
        profesorId: prof.teacherId,
        seccionId: seccion.id,
        cursoCatalogoId: catalogo?.id,
        periodo: "2026",
      },
    });
    courses.push(course.id);
  }

  const levels: RiskLevel[] = ["bajo", "medio", "alto"];
  for (let i = 1; i <= 50; i++) {
    const email = `estudiante${String(i).padStart(2, "0")}@iep-huancayo.edu.pe`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hash,
        nombres: `Estudiante`,
        apellidos: `${i}`,
        role: "estudiante",
      },
    });
    const promedio = 8 + (i % 12);
    const asistencia = 60 + (i % 40);
    const level = levels[i % 3];
    const student = await prisma.student.upsert({
      where: { codigo: `EST-2026-${String(i).padStart(3, "0")}` },
      update: {
        userId: user.id,
        promedioGeneral: promedio,
        asistenciaGeneral: asistencia,
      },
      create: {
        userId: user.id,
        codigo: `EST-2026-${String(i).padStart(3, "0")}`,
        nombres: "Estudiante",
        apellidos: `${i}`,
        seccionId: seccion.id,
        correo: email,
        promedioGeneral: promedio,
        asistenciaGeneral: asistencia,
        lmsEngagement: i % 3 === 0 ? "bajo" : i % 3 === 1 ? "medio" : "alto",
      },
    });

    const courseId = courses[i % courses.length];
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId_periodo: { studentId: student.id, courseId, periodo: PERIODO },
      },
      update: {},
      create: { studentId: student.id, courseId, periodo: PERIODO },
    });

    await prisma.grade.upsert({
      where: {
        studentId_courseId_periodo_bimestre: {
          studentId: student.id,
          courseId,
          periodo: PERIODO,
          bimestre: 1,
        },
      },
      update: { nota: promedio },
      create: {
        studentId: student.id,
        courseId,
        periodo: PERIODO,
        bimestre: 1,
        nota: promedio,
      },
    });

    await prisma.attendance.create({
      data: {
        studentId: student.id,
        fecha: new Date(),
        presente: asistencia >= 75,
        tardanza: asistencia < 85 && asistencia >= 70,
      },
    });

    await prisma.lmsActivity.create({
      data: {
        studentId: student.id,
        semana: "2026-S1",
        actividadPct: asistencia,
        minutos: 120 + i * 5,
        tareasEntregadas: Math.min(10, 4 + (i % 7)),
        tareasTotales: 10,
        horasPlataforma: 2 + (i % 8),
      },
    });

    const score = level === "alto" ? 78 : level === "medio" ? 52 : 22;
    await prisma.prediction.create({
      data: {
        studentId: student.id,
        score,
        level,
        probability: score / 100,
        modelVersion: "2.1",
        modelName: "stacking",
        factorsJson: JSON.stringify([
          { key: "asistencia", label: "Asistencia", contribution: 100 - asistencia },
        ]),
        metaJson: JSON.stringify({ source: "seed-demo" }),
      },
    });

    if (level !== "bajo") {
      await prisma.alert.create({
        data: {
          studentId: student.id,
          titulo: `[${level === "alto" ? "ALTA" : "MEDIA"}] Alerta demo — riesgo ${level}`,
          descripcion: `Score ${score}/100`,
          level,
          score,
          probability: score / 100,
          factorsJson: JSON.stringify([
            { key: "promedio", label: "Promedio académico", contribution: 20 - promedio },
          ]),
          recommendation: "Seguimiento académico y refuerzo en LMS.",
          status: "nueva",
        },
      });
    }
  }

  await prisma.chatMessage.create({
    data: {
      roomId: "global:institucional",
      scope: "global",
      senderId: director.id,
      senderName: "Carlos Ramírez",
      senderRole: "admin",
      contenido: "Bienvenidos al periodo 2026-I. Revisen sus indicadores de riesgo en el panel.",
    },
  });

  console.log("OK seed demo:");
  console.log("  Director: director@iep-huancayo.edu.pe");
  console.log("  Profesores: profesor1@iep-huancayo.edu.pe … profesor5@");
  console.log("  Estudiantes: estudiante01@ … estudiante50@");
  console.log(`  Contraseña: ${PASSWORD}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
