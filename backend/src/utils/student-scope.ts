/**
 * Alcance de estudiantes según rol (RBAC operativo).
 * admin/tutor/psicologo: cohorte activa; docente: sus cursos; estudiante/apoderado: solo propio.
 */
import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "./prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export type ScopeUser = { sub: string; role: UserRole };

export async function resolveStudentScope(user: ScopeUser): Promise<Prisma.StudentWhereInput> {
  const base: Prisma.StudentWhereInput = { activo: true };

  if (user.role === "admin" || user.role === "tutor" || user.role === "psicologo") {
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

  if (user.role === "apoderado") {
    const apoderado = await prisma.apoderado.findFirst({ where: { userId: user.sub } });
    if (!apoderado) return { id: "__none__" };
    const links = await prisma.studentApoderado.findMany({
      where: { apoderadoId: apoderado.id },
      select: { studentId: true },
    });
    const ids = links.map((l) => l.studentId);
    if (!ids.length) return { id: "__none__" };
    return { id: { in: ids } };
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
