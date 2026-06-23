import type { Prisma, PrismaClient } from "@prisma/client";
import { syncCourseOffering } from "../../src/services/teacher-assignment.service.js";
import { buildCourseCodigoForSeccion } from "../../src/utils/course-section.js";

function computeNota(studentId: bigint, courseId: bigint, periodoIndex: number, baseNota: number): number {
  const seed = Number(studentId) + Number(courseId) + periodoIndex * 17;
  const delta = (seed % 7) - 3;
  return Math.round(Math.min(20, Math.max(6, baseNota + delta * 0.65)) * 10) / 10;
}

/** Garantiza curso_oferta para cada curso del grado en cada sección activa. */
async function ensureSectionOfferings(prisma: PrismaClient, anioLectivoId: bigint) {
  const secciones = await prisma.seccion.findMany({
    where: { activo: true },
    include: { grado: { include: { nivel: true } } },
  });

  let created = 0;
  for (const sec of secciones) {
    const cursosGrado = await prisma.cursoGrado.findMany({
      where: { gradoId: sec.gradoId },
      include: { curso: { select: { id: true, codigo: true } } },
    });

    for (const cg of cursosGrado) {
      const existing = await prisma.course.findFirst({
        where: {
          cursoId: cg.cursoId,
          seccionId: sec.id,
          anioLectivoId,
        },
      });
      if (existing) continue;

      const assignment = await prisma.teacherCourseAssignment.findFirst({
        where: {
          cursoId: cg.cursoId,
          seccionId: sec.id,
          anioLectivoId,
          activo: true,
        },
      });
      if (!assignment) continue;

      await syncCourseOffering(assignment, sec);
      created++;
    }

    for (const cg of cursosGrado) {
      const exists = await prisma.course.findFirst({
        where: { cursoId: cg.cursoId, seccionId: sec.id, anioLectivoId, activo: true },
      });
      if (exists) continue;

      const fallbackTeacher =
        (await prisma.teacherCourseAssignment.findFirst({
          where: { seccionId: sec.id, anioLectivoId, activo: true },
          select: { profesorId: true },
        })) ??
        (await prisma.tutorSeccion.findFirst({
          where: { seccionId: sec.id, anioLectivoId, activo: true },
          select: { profesorId: true },
        }));

      if (!fallbackTeacher) continue;

      const codigo = buildCourseCodigoForSeccion(cg.curso.codigo, sec);
      await prisma.course.create({
        data: {
          codigo,
          cursoId: cg.cursoId,
          seccionId: sec.id,
          profesorId: fallbackTeacher.profesorId,
          anioLectivoId,
          activo: true,
        },
      });
      created++;
    }
  }

  if (created > 0) {
    console.log(`  Ofertas curriculares creadas: ${created}`);
  }
}

/** Completa notas faltantes I–II y deja III–IV vacíos. */
export async function repairBimesterGrades(
  prisma: PrismaClient,
  anioLectivoId: bigint,
  periodoIds: bigint[],
) {
  if (periodoIds.length === 0) return { created: 0, enrollments: 0 };

  await ensureSectionOfferings(prisma, anioLectivoId);

  const removedLater = await prisma.grade.deleteMany({
    where: {
      periodo: { anioLectivoId, numero: { in: [3, 4] } },
    },
  });
  if (removedLater.count > 0) {
    console.log(`  Eliminadas ${removedLater.count} notas de bimestres III–IV`);
  }

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

  const grades: Prisma.GradeCreateManyInput[] = [];
  const enrollments: Prisma.EnrollmentCreateManyInput[] = [];
  let missingBefore = 0;

  for (const student of students) {
    const courseIds = coursesBySection.get(String(student.seccionId)) ?? [];
    const baseNota = Number(student.promedioGeneral) || 12;

    for (const courseId of courseIds) {
      enrollments.push({
        studentId: student.id,
        cursoOfertaId: courseId,
        estado: "activa",
      });

      for (let pi = 0; pi < periodoIds.length; pi++) {
        const periodoId = periodoIds[pi]!;
        const exists = await prisma.grade.findUnique({
          where: {
            studentId_cursoOfertaId_periodoId: {
              studentId: student.id,
              cursoOfertaId: courseId,
              periodoId,
            },
          },
        });
        if (exists) continue;
        missingBefore++;
        grades.push({
          studentId: student.id,
          cursoOfertaId: courseId,
          periodoId,
          nota: computeNota(student.id, courseId, pi, baseNota),
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

  return { created: grades.length, enrollments: enrollments.length, missingBefore };
}

/** Inscribe a cada estudiante en los cursos de su sección y califica solo I y II bimestre (III–IV vacíos). */
export async function seedBimesterGrades(
  prisma: PrismaClient,
  anioLectivoId: bigint,
  periodoIds: bigint[],
) {
  if (periodoIds.length === 0) return;

  console.log(`  Calificaciones (${periodoIds.length} bimestre(s))…`);

  await ensureSectionOfferings(prisma, anioLectivoId);

  await prisma.grade.deleteMany({
    where: {
      OR: [
        { periodoId: { in: periodoIds } },
        { periodo: { anioLectivoId, numero: { in: [3, 4] } } },
      ],
    },
  });
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
  let studentsSinCursos = 0;

  for (const student of students) {
    const sectionKey = String(student.seccionId);
    const courseIds = coursesBySection.get(sectionKey) ?? [];
    if (courseIds.length === 0) {
      studentsSinCursos++;
      continue;
    }
    const baseNota = Number(student.promedioGeneral) || 12;

    for (const courseId of courseIds) {
      enrollments.push({
        studentId: student.id,
        cursoOfertaId: courseId,
        estado: "activa",
      });

      for (let pi = 0; pi < periodoIds.length; pi++) {
        grades.push({
          studentId: student.id,
          cursoOfertaId: courseId,
          periodoId: periodoIds[pi]!,
          nota: computeNota(student.id, courseId, pi, baseNota),
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
    `  OK — ${enrollments.length} inscripciones · ${grades.length} calificaciones (I–II bimestre) · ${students.length - studentsSinCursos} alumnos`,
  );
  if (studentsSinCursos > 0) {
    console.warn(`  ⚠ ${studentsSinCursos} estudiantes sin cursos en su sección`);
  }
}
