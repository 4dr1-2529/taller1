/**
 * Alcance de estudiantes — 3 roles: Director (admin), Profesor (docente), Estudiante.
 */
import type { Prisma, RolCodigo } from "@prisma/client";
import { prisma } from "./prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { toDbId } from "./ids.js";
import {
  getTeacherIdFromUser,
  getTeacherSectionIds,
  studentWhereForSectionIds,
} from "./teacher-scope.js";

export type ScopeUser = { sub: string; role: RolCodigo };

const NONE: Prisma.StudentWhereInput = { id: { in: [] } };

export async function resolveStudentScope(user: ScopeUser): Promise<Prisma.StudentWhereInput> {
  const base: Prisma.StudentWhereInput = { activo: true };

  if (user.role === "admin") {
    return base;
  }

  if (user.role === "docente") {
    const teacherId = await getTeacherIdFromUser(user.sub);
    if (!teacherId) return NONE;
    const sectionIds = await getTeacherSectionIds(teacherId);
    return studentWhereForSectionIds(sectionIds, base);
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
    const teacherId = await getTeacherIdFromUser(user.sub);
    if (!teacherId) return { id: { in: [] } };
    return { activo: true, profesorId: teacherId };
  }
  if (user.role === "estudiante") {
    const student = await prisma.student.findFirst({
      where: { usuarioId: toDbId(user.sub), activo: true },
    });
    if (!student?.seccionId) return { id: { in: [] } };
    return { activo: true, seccionId: student.seccionId };
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
    throw new AppError(403, "No tiene permiso para acceder a este estudiante.", "FORBIDDEN");
  }
}
