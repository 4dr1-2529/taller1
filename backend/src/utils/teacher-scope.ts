/**
 * Alcance académico del profesor (docente): cursos → secciones → estudiantes del salón.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { toDbId } from "./ids.js";
import type { ScopeUser } from "./student-scope.js";

export async function getTeacherIdFromUser(userId: string): Promise<bigint | null> {
  const teacher = await prisma.teacher.findFirst({
    where: { usuarioId: toDbId(userId), activo: true },
    select: { id: true },
  });
  return teacher?.id ?? null;
}

export async function getTeacherSectionIds(teacherId: bigint): Promise<bigint[]> {
  const courses = await prisma.course.findMany({
    where: { profesorId: teacherId, activo: true },
    select: { seccionId: true },
  });
  return [...new Set(courses.map((c) => c.seccionId).filter((id): id is bigint => id != null))];
}

export function studentWhereForSectionIds(
  sectionIds: bigint[],
  base?: Prisma.StudentWhereInput,
): Prisma.StudentWhereInput {
  const whereBase = base ?? { activo: true };
  if (!sectionIds.length) {
    return { id: { in: [] } };
  }
  return { ...whereBase, seccionId: { in: sectionIds } };
}

export async function resolveTeacherSectionIds(user: ScopeUser): Promise<bigint[]> {
  if (user.role !== "docente") return [];
  const teacherId = await getTeacherIdFromUser(user.sub);
  if (!teacherId) return [];
  return getTeacherSectionIds(teacherId);
}

export async function resolveTeacherCourseWhere(user: ScopeUser): Promise<Prisma.CourseWhereInput> {
  if (user.role !== "docente") return { id: { in: [] } };
  const teacherId = await getTeacherIdFromUser(user.sub);
  if (!teacherId) return { id: { in: [] } };
  return { activo: true, profesorId: teacherId };
}
