/**
 * Alcance de estudiantes — 3 roles: Director (admin), Profesor (docente), Estudiante.
 */
import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "./prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export type ScopeUser = { sub: string; role: UserRole };

export async function resolveStudentScope(user: ScopeUser): Promise<Prisma.StudentWhereInput> {
  const base: Prisma.StudentWhereInput = { activo: true };

  if (user.role === "admin") {
    return base;
  }

  if (user.role === "docente") {
    const teacher = await prisma.teacher.findFirst({ where: { userId: user.sub, activo: true } });
    if (!teacher) return { id: "__none__" };
    const enrollments = await prisma.enrollment.findMany({
      where: { course: { profesorId: teacher.id } },
      select: { studentId: true },
    });
    const ids = [...new Set(enrollments.map((e) => e.studentId))];
    if (!ids.length) return { id: "__none__" };
    return { ...base, id: { in: ids } };
  }

  if (user.role === "estudiante") {
    const student = await prisma.student.findFirst({ where: { userId: user.sub, activo: true } });
    return student ? { id: student.id } : { id: "__none__" };
  }

  return { id: "__none__" };
}

export async function resolveCourseScope(user: ScopeUser): Promise<Prisma.CourseWhereInput> {
  if (user.role === "admin") return { activo: true };
  if (user.role === "docente") {
    const teacher = await prisma.teacher.findFirst({ where: { userId: user.sub, activo: true } });
    if (!teacher) return { id: "__none__" };
    return { activo: true, profesorId: teacher.id };
  }
  if (user.role === "estudiante") {
    const student = await prisma.student.findFirst({ where: { userId: user.sub, activo: true } });
    if (!student) return { id: "__none__" };
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      select: { courseId: true },
    });
    const ids = enrollments.map((e) => e.courseId);
    return ids.length ? { id: { in: ids }, activo: true } : { id: "__none__" };
  }
  return { id: "__none__" };
}

export async function assertStudentInScope(user: ScopeUser, studentId: string): Promise<void> {
  const scope = await resolveStudentScope(user);
  const found = await prisma.student.findFirst({
    where: { id: studentId, ...scope },
    select: { id: true },
  });
  if (!found) {
    throw new AppError(403, "Sin permiso para este estudiante", "FORBIDDEN");
  }
}
