import type { Prisma, LmsEventType, RolCodigo } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { assertTeacherCourseAccess } from "../utils/course-authorization.js";

type User = { sub: string; role: RolCodigo };
export async function assertLmsCourse(user: User, courseId: bigint) {
  const course = await prisma.course.findFirst({ where: { id: courseId, activo: true, anioLectivo: { anio: 2026 } } });
  if (!course) throw new AppError(404, "Curso activo 2026 no encontrado");
  if (user.role === "admin") return;
  if (user.role === "docente") return assertTeacherCourseAccess(user, String(courseId));
  const enrolled = await prisma.enrollment.findFirst({ where: { cursoOfertaId: courseId, estado: "activa", student: { usuarioId: BigInt(user.sub), activo: true, matriculas: { some: { anioLectivoId: course.anioLectivoId, seccionId: course.seccionId, estado: "activa" } } } } });
  if (!enrolled) throw new AppError(403, "Curso fuera de su matrícula");
}

export async function recordLmsEvent(user: User, tipo: LmsEventType, ids: { courseId?: bigint; resourceId?: bigint; activityId?: bigint } = {}) {
  if (user.role !== "estudiante") return;
  const student = await prisma.student.findFirst({ where: { usuarioId: BigInt(user.sub), activo: true } });
  if (!student) throw new AppError(403, "Estudiante no vinculado");
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM estudiante WHERE id = ${student.id} FOR UPDATE`;
    const last = await tx.lmsEvent.findFirst({ where: { studentId: student.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
    const now = new Date();
    const elapsed = last ? Math.floor((now.getTime() - last.createdAt.getTime()) / 1000) : 0;
    // Estimate observed interaction, excluding idle gaps over five minutes.
    const durationSeconds = last && last.tipo !== "logout" && tipo !== "login" && elapsed <= 300 ? Math.max(0, elapsed) : 0;
    await tx.lmsEvent.create({ data: { studentId: student.id, tipo, ...ids, durationSeconds, createdAt: now } });
  });
}

export async function studentIndicators(studentId: bigint, now = new Date()) {
  const from = new Date(Math.max(Date.UTC(2026, 0, 1), now.getTime() - 28 * 86400000));
  const events = await prisma.lmsEvent.findMany({ where: { studentId, createdAt: { gte: from, lte: now } }, orderBy: { createdAt: "asc" } });
  const completed = await prisma.activityProgress.count({ where: { studentId, estado: "completada", completedAt: { gte: from, lte: now }, activity: { course: { anioLectivo: { anio: 2026 } } } } });
  const grades = await prisma.grade.groupBy({ by: ["cursoOfertaId"], where: { studentId, periodo: { anioLectivo: { anio: 2026 } } }, _avg: { nota: true } });
  const attendance = await prisma.attendance.findMany({ where: { studentId, fecha: { gte: new Date("2026-01-01"), lt: new Date("2027-01-01") } } });
  const graded = grades.map(g => Number(g._avg.nota));
  const computable = attendance.filter(a => !a.justificado);
  return {
    promedio_general: graded.length ? graded.reduce((a,b) => a+b,0) / graded.length : null,
    cursos_desaprobados: graded.filter(n => n < 11).length,
    asistencia_general: computable.length ? 100 * computable.filter(a => a.presente || a.tardanza).length / computable.length : null,
    frecuencia_acceso_lms: events.filter(e => e.tipo === "login").length / 4,
    tiempo_interaccion_lms: events.reduce((sum,e) => sum + e.durationSeconds,0) / 3600,
    actividades_realizadas: completed,
    recursos_consultados: new Set(events.filter(e => e.resourceId).map(e => String(e.resourceId))).size,
    dias_activos: new Set(events.map(e => e.createdAt.toLocaleDateString("en-CA", { timeZone: "America/Lima" }))).size,
    ultimo_acceso: events.at(-1)?.createdAt ?? null,
    ventana_desde: from, ventana_hasta: now,
  };
}
