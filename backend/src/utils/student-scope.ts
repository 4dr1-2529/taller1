/**
 * Alcance de estudiantes — 3 roles: Director (admin), Profesor (docente), Estudiante.
 */
import type { Prisma, RolCodigo } from "@prisma/client";
import { prisma } from "./prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { toDbId } from "./ids.js";

export type ScopeUser = { sub: string; role: RolCodigo };

const NONE: Prisma.StudentWhereInput = { id: { in: [] } };

export async function resolveStudentScope(user: ScopeUser): Promise<Prisma.StudentWhereInput> {
  const base: Prisma.StudentWhereInput = { activo: true };

  if (user.role === "admin") {
    return base;
  }

  if (user.role === "docente") {
    const teacher = await prisma.teacher.findFirst({
      where: { usuarioId: toDbId(user.sub), activo: true },
    });
    if (!teacher) return NONE;
    const enrollments = await prisma.enrollment.findMany({
      where: { course: { profesorId: teacher.id } },
      select: { studentId: true },
    });
    const ids = [...new Set(enrollments.map((e) => e.studentId))];
    if (!ids.length) return NONE;
    return { ...base, id: { in: ids } };
  }

  if (user.role === "estudiante") {
    const student = await prisma.student.findFirst({
      where: { usuarioId: toDbId(user.sub), activo: true },
    });
    return student ? { id: student.id } : NONE;
  }

  return NONE;
}

export async function resolveCourseScope(user: ScopeUser): Promise<Prisma.CourseWhereInput> {
  if (user.role === "admin") return { activo: true };
  if (user.role === "docente") {
    const teacher = await prisma.teacher.findFirst({
      where: { usuarioId: toDbId(user.sub), activo: true },
    });
    if (!teacher) return { id: { in: [] } };
    return { activo: true, profesorId: teacher.id };
  }
  if (user.role === "estudiante") {
    const student = await prisma.student.findFirst({
      where: { usuarioId: toDbId(user.sub), activo: true },
    });
    if (!student) return { id: { in: [] } };
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      select: { cursoOfertaId: true },
    });
    const ids = enrollments.map((e) => e.cursoOfertaId);
    return ids.length ? { id: { in: ids }, activo: true } : { id: { in: [] } };
  }
  return { id: { in: [] } };
}

export async function assertStudentInScope(user: ScopeUser, studentId: string): Promise<void> {
  const scope = await resolveStudentScope(user);
  const found = await prisma.student.findFirst({
    where: { id: toDbId(studentId), ...scope },
    select: { id: true },
  });
  if (!found) {
    throw new AppError(403, "Sin permiso para este estudiante", "FORBIDDEN");
  }
}
