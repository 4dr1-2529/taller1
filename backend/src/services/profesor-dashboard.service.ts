import { prisma } from "../utils/prisma.js";
import { buildDashboardAnalytics } from "./dashboard-analytics.service.js";
import { buildProfesorStudentWhere } from "../utils/profesor-query.js";

export async function buildProfesorDashboard(teacherId: bigint) {
  const scope = await buildProfesorStudentWhere(teacherId, {});
  const analytics = await buildDashboardAnalytics(scope);

  const [totalCourses, sectionIds] = await Promise.all([
    prisma.course.count({ where: { profesorId: teacherId, activo: true } }),
    prisma.course.findMany({
      where: { profesorId: teacherId, activo: true },
      select: { seccionId: true, id: true, seccion: { select: { nombre: true, grado: { select: { numero: true } } } } },
    }),
  ]);

  const uniqueSections = new Set(
    sectionIds.map((c) => c.seccionId).filter((id): id is bigint => id != null),
  );

  const courses = await prisma.course.findMany({
    where: { profesorId: teacherId, activo: true },
    include: {
      seccion: { include: { grado: true } },
      cursoCatalogo: { select: { nombre: true } },
      calificaciones: { select: { nota: true } },
    },
  });

  const avgByCourse = courses.map((c) => {
    const notas = c.calificaciones.map((g) => Number(g.nota));
    const avg = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    const grado = c.seccion?.grado?.numero ?? 0;
    const sec = c.seccion?.nombre ?? "";
    return {
      courseId: String(c.id),
      nombre: c.cursoCatalogo?.nombre ?? c.codigo,
      salon: grado && sec ? `${grado}°${sec}` : "—",
      promedio: Math.round(avg * 10) / 10,
      totalNotas: notas.length,
    };
  });

  return {
    ...analytics,
    kpis: {
      ...analytics.kpis,
      totalTeachers: 1,
      totalSalones: uniqueSections.size,
      totalCourses,
      misSecciones: uniqueSections.size,
    },
    avgByCourse,
  };
}
