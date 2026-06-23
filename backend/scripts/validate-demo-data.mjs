/**
 * Valida datos demo: alumnos por salón y cobertura de notas I–II bimestre.
 * Uso: node scripts/validate-demo-data.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ALUMNOS_POR_SALON = 30;

const anio = await prisma.anioLectivo.findFirst({ where: { anio: 2026 } });
const periodos = anio
  ? await prisma.periodoAcademico.findMany({
      where: { anioLectivoId: anio.id, numero: { in: [1, 2] } },
    })
  : [];

const secciones = await prisma.seccion.findMany({
  include: { grado: true, _count: { select: { estudiantes: true } } },
  orderBy: [{ grado: { numero: "asc" } }, { nombre: "asc" }],
});

let ok = true;
for (const sec of secciones) {
  const n = sec._count.estudiantes;
  if (sec.capacidad !== ALUMNOS_POR_SALON || n !== ALUMNOS_POR_SALON) {
    console.warn(
      `  ⚠ ${sec.grado.numero}° ${sec.nombre}: ${n}/${ALUMNOS_POR_SALON} alumnos · capacidad ${sec.capacidad}`,
    );
    ok = false;
  }
}

const total = await prisma.student.count();
const esperado = secciones.length * ALUMNOS_POR_SALON;

if (anio && periodos.length >= 2) {
  const offerings = await prisma.course.count({ where: { anioLectivoId: anio.id, activo: true } });
  const grades = await prisma.grade.count({
    where: { periodoId: { in: periodos.map((p) => p.id) } },
  });
  const enrollments = await prisma.enrollment.count();
  console.log(`  Ofertas activas: ${offerings} · Inscripciones: ${enrollments} · Notas I–II: ${grades}`);

  const studentsSinNotas = await prisma.student.count({
    where: {
      activo: true,
      NOT: { calificaciones: { some: { periodoId: { in: periodos.map((p) => p.id) } } } },
    },
  });
  if (studentsSinNotas > 0) {
    console.warn(`  ⚠ ${studentsSinNotas} estudiantes sin notas en bimestres I–II`);
    ok = false;
  }

  const gradesB34 = await prisma.grade.count({
    where: {
      periodo: { anioLectivoId: anio.id, numero: { in: [3, 4] } },
    },
  });
  if (gradesB34 > 0) {
    console.warn(`  ⚠ ${gradesB34} notas en bimestres III–IV (deben estar vacíos)`);
    ok = false;
  }

  const tutores = await prisma.tutorSeccion.count({ where: { anioLectivoId: anio.id, activo: true } });
  if (tutores !== 8) {
    console.warn(`  ⚠ Tutores 1°-2°: ${tutores}/8 (esperado 1 tutor por salón)`);
    ok = false;
  }

  const profesores = await prisma.teacher.count({ where: { activo: true } });
  console.log(`  Profesores activos: ${profesores} (8 tutores + polidocencia 3°-6°)`);
}

if (ok && total === esperado) {
  console.log(
    `Validación OK — ${secciones.length} salones × ${ALUMNOS_POR_SALON} = ${total} estudiantes`,
  );
} else {
  console.error(`Validación fallida — total ${total}, esperado ${esperado}`);
  process.exitCode = 1;
}

await prisma.$disconnect();
