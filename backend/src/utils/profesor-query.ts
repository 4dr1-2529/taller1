/**
 * Consultas del profesor autenticado — cursos → secciones → matrícula activa → estudiantes.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { toDbId } from "./ids.js";
import { getTeacherIdFromUser, getTeacherSectionIds, studentWhereForSectionIds } from "./teacher-scope.js";

export type ProfesorQuery = {
  gradoId?: string;
  seccionId?: string;
  cursoId?: string;
  search?: string;
};

export async function requireTeacherIdFromUser(userId: string): Promise<bigint> {
  const id = await getTeacherIdFromUser(userId);
  if (!id) throw new Error("TEACHER_NOT_LINKED");
  return id;
}

export async function getTeacherCourseSectionIds(
  teacherId: bigint,
  query: ProfesorQuery,
): Promise<bigint[]> {
  const all = await getTeacherSectionIds(teacherId);
  if (!query.gradoId && !query.seccionId && !query.cursoId) return all;

  const courses = await prisma.course.findMany({
    where: {
      profesorId: teacherId,
      activo: true,
      ...(query.cursoId ? { id: toDbId(query.cursoId) } : {}),
      ...(query.seccionId ? { seccionId: toDbId(query.seccionId) } : {}),
      ...(query.gradoId ? { seccion: { gradoId: toDbId(query.gradoId) } } : {}),
    },
    select: { seccionId: true },
  });
  const ids = [...new Set(courses.map((c) => c.seccionId).filter((id): id is bigint => id != null))];
  return ids.filter((id) => all.includes(id));
}

export async function buildProfesorStudentWhere(
  teacherId: bigint,
  query: ProfesorQuery,
): Promise<Prisma.StudentWhereInput> {
  const sectionIds = await getTeacherCourseSectionIds(teacherId, query);
  if (!sectionIds.length) return { id: { in: [] } };

  const anio = await prisma.anioLectivo.findFirst({ where: { activo: true }, select: { id: true } });
  const base = studentWhereForSectionIds(sectionIds);

  const where: Prisma.StudentWhereInput = {
    ...base,
    matriculas: {
      some: {
        estado: "activa",
        ...(anio ? { anioLectivoId: anio.id } : {}),
      },
    },
  };

  const term = query.search?.trim();
  if (term) {
    where.OR = [
      { nombres: { contains: term } },
      { apellidos: { contains: term } },
      { codigo: { contains: term } },
    ];
  }

  return where;
}

export function parseProfesorQuery(req: { query: Record<string, unknown> }): ProfesorQuery {
  const q = req.query;
  return {
    gradoId: (q.gradoId as string) || undefined,
    seccionId: (q.seccionId as string) || undefined,
    cursoId: (q.cursoId as string) || undefined,
    search: (q.search as string) || (q.q as string) || undefined,
  };
}
