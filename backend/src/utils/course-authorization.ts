import type { RolCodigo } from "@prisma/client";
import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "./prisma.js";
import { toDbId } from "./ids.js";
import { getTeacherIdForUser } from "./teacher.js";

type AuthUser = { sub: string; role: RolCodigo };

/** Profesor solo puede operar sobre cursos que le pertenecen. */
export async function assertTeacherCourseAccess(user: AuthUser, courseId: string): Promise<void> {
  if (user.role === "admin") return;
  if (user.role !== "docente") {
    throw new AppError(403, "Permiso denegado", "FORBIDDEN");
  }
  const teacherId = await getTeacherIdForUser(user.sub);
  if (!teacherId) throw new AppError(403, "Profesor no vinculado a una cuenta", "FORBIDDEN");

  const course = await prisma.course.findFirst({
    where: { id: toDbId(courseId), profesorId: toDbId(teacherId), activo: true },
    select: { id: true },
  });
  if (!course) {
    throw new AppError(403, "No autorizado para este curso", "FORBIDDEN");
  }
}

/** El estudiante debe pertenecer al mismo salón que la oferta del curso. */
export async function assertStudentInCourseSection(studentId: string, courseId: string): Promise<void> {
  const [course, student] = await Promise.all([
    prisma.course.findFirst({
      where: { id: toDbId(courseId), activo: true },
      select: { seccionId: true },
    }),
    prisma.student.findFirst({
      where: { id: toDbId(studentId), activo: true },
      select: { seccionId: true },
    }),
  ]);
  if (!course?.seccionId || !student?.seccionId || course.seccionId !== student.seccionId) {
    throw new AppError(403, "No tiene permiso para acceder a este estudiante.", "FORBIDDEN");
  }
}
