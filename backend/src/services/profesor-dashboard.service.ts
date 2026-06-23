import { prisma } from "../utils/prisma.js";
import { buildDashboardAnalytics } from "./dashboard-analytics.service.js";
import { buildProfesorStudentWhere } from "../utils/profesor-query.js";
import { getTeacherWorkload } from "./teacher-assignment.service.js";

export async function buildProfesorDashboard(teacherId: bigint) {
  const scope = await buildProfesorStudentWhere(teacherId, {});
  const analytics = await buildDashboardAnalytics(scope);
  const workload = await getTeacherWorkload(teacherId);

  const courses = await prisma.course.findMany({
    where: { profesorId: teacherId, activo: true },
    include: {
      seccion: { include: { grado: true } },
      cursoCatalogo: { select: { nombre: true } },
      calificaciones: { select: { nota: true, periodo: { select: { id: true, numero: true } } } },
    },
  });

  const periodos = await prisma.periodoAcademico.findMany({
    where: { numero: { in: [1, 2] }, activo: true },
    select: { id: true, numero: true },
    take: 2,
  });
  const periodoIds = periodos.map((p) => p.id);

  let notasPendientes = 0;
  const avgBySectionMap = new Map<string, { sum: number; count: number }>();

  for (const c of courses) {
    const secId = c.seccionId;
    if (!secId) continue;
    const studentCount = await prisma.student.count({
      where: await buildProfesorStudentWhere(teacherId, { seccionId: String(secId) }),
    });
    const gradesB12 = c.calificaciones.filter((g) => periodoIds.includes(g.periodo.id));
    const expected = studentCount * Math.max(1, periodoIds.length);
    notasPendientes += Math.max(0, expected - gradesB12.length);

    const salon = c.seccion ? `${c.seccion.grado.numero}°${c.seccion.nombre}` : "—";
    const notas = c.calificaciones.map((g) => Number(g.nota));
    const avg = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    const prev = avgBySectionMap.get(salon) ?? { sum: 0, count: 0 };
    avgBySectionMap.set(salon, { sum: prev.sum + avg, count: prev.count + 1 });
  }

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

  const avgBySection = [...avgBySectionMap.entries()].map(([salon, v]) => ({
    salon,
    promedio: v.count ? Math.round((v.sum / v.count) * 10) / 10 : 0,
  }));

  return {
    ...analytics,
    workload,
    kpis: {
      ...analytics.kpis,
      totalTeachers: 1,
      totalSalones: workload.secciones.length,
      totalCourses: workload.cursos.length,
      misSecciones: workload.secciones.length,
      totalAlumnos: workload.totalAlumnos,
      notasPendientes,
    },
    avgByCourse,
    avgBySection,
    cursosAsignados: workload.cursos,
    seccionesAsignadas: workload.secciones,
    gradosAsignados: workload.grados,
  };
}
