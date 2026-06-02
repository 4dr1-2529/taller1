import type { Prisma } from "@prisma/client";

type CourseWithCatalog = {
  codigo: string;
  cursoCatalogo?: { nombre: string } | null;
};

export function courseDisplayName(course: CourseWithCatalog): string {
  return course.cursoCatalogo?.nombre ?? course.codigo;
}

export const courseListInclude = {
  profesor: { select: { id: true, nombres: true, apellidos: true, usuarioId: true } },
  cursoCatalogo: { select: { id: true, codigo: true, nombre: true } },
  seccion: { include: { grado: { include: { nivel: true } } } },
} satisfies Prisma.CourseInclude;

export function mapCourseForApi<T extends CourseWithCatalog & Record<string, unknown>>(course: T) {
  return { ...course, nombre: courseDisplayName(course) };
}
