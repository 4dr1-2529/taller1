import type { Prisma, PrismaClient } from "@prisma/client";

/** Inscribe a cada estudiante en los cursos de su sección y califica I y II bimestre. */
export async function seedBimesterGrades(
  prisma: PrismaClient,
  anioLectivoId: bigint,
  periodoIds: bigint[],
) {
  if (periodoIds.length === 0) return;

  console.log(`  Calificaciones (${periodoIds.length} bimestre(s))…`);

  await prisma.grade.deleteMany({});
  await prisma.enrollment.deleteMany({});

  const offerings = await prisma.course.findMany({
    where: { anioLectivoId, activo: true },
    select: { id: true, seccionId: true },
  });

  const coursesBySection = new Map<string, bigint[]>();
  for (const row of offerings) {
    const key = String(row.seccionId);
    const list = coursesBySection.get(key) ?? [];
    list.push(row.id);
    coursesBySection.set(key, list);
  }

  const students = await prisma.student.findMany({
    where: { activo: true, seccionId: { not: null } },
    select: { id: true, seccionId: true, promedioGeneral: true },
  });

  const enrollments: Prisma.EnrollmentCreateManyInput[] = [];
  const grades: Prisma.GradeCreateManyInput[] = [];

  for (const student of students) {
    const sectionKey = String(student.seccionId);
    const courseIds = coursesBySection.get(sectionKey) ?? [];
    const baseNota = Number(student.promedioGeneral) || 12;

    for (const courseId of courseIds) {
      enrollments.push({
        studentId: student.id,
        cursoOfertaId: courseId,
        estado: "activa",
      });

      for (let pi = 0; pi < periodoIds.length; pi++) {
        const periodoId = periodoIds[pi]!;
        const seed = Number(student.id) + Number(courseId) + pi * 17;
        const delta = (seed % 7) - 3;
        const nota = Math.round(Math.min(20, Math.max(6, baseNota + delta * 0.65)) * 10) / 10;

        grades.push({
          studentId: student.id,
          cursoOfertaId: courseId,
          periodoId,
          nota,
        });
      }
    }
  }

  for (let i = 0; i < enrollments.length; i += 800) {
    await prisma.enrollment.createMany({
      data: enrollments.slice(i, i + 800),
      skipDuplicates: true,
    });
  }

  for (let i = 0; i < grades.length; i += 800) {
    await prisma.grade.createMany({
      data: grades.slice(i, i + 800),
      skipDuplicates: true,
    });
  }

  console.log(
    `  OK — ${enrollments.length} inscripciones · ${grades.length} calificaciones (I–II bimestre)`,
  );
}
