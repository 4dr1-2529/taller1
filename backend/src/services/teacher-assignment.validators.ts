import type { Prisma } from "@prisma/client";
import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import {
  MAX_POLIDOCENCIA_COURSES,
  MAX_POLIDOCENCIA_SECTIONS,
} from "../config/polidocencia.js";

export function isTutorGrade(numero: number): boolean {
  return numero >= 1 && numero <= 2;
}

export async function assertPolidocenciaTeacherLimits(
  profesorId: bigint,
  cursoId: bigint,
  seccionId: bigint,
  anioLectivoId: bigint,
  gradoNumero: number,
  tx: Prisma.TransactionClient = prisma,
) {
  if (isTutorGrade(gradoNumero)) return;

  const active = await tx.teacherCourseAssignment.findMany({
    where: {
      profesorId,
      anioLectivoId,
      activo: true,
      esTutor: false,
      grado: { numero: { gte: 3 } },
    },
    select: { cursoId: true, seccionId: true },
  });

  const courseIds = new Set(active.map((a) => a.cursoId.toString()));
  const sectionIds = new Set(active.map((a) => a.seccionId.toString()));
  const cursoKey = cursoId.toString();
  const seccionKey = seccionId.toString();

  if (!courseIds.has(cursoKey) && courseIds.size >= MAX_POLIDOCENCIA_COURSES) {
    throw new AppError(
      400,
      `En polidocencia (3°–6°) cada docente dicta como máximo ${MAX_POLIDOCENCIA_COURSES} cursos distintos`,
    );
  }
  if (!sectionIds.has(seccionKey) && sectionIds.size >= MAX_POLIDOCENCIA_SECTIONS) {
    throw new AppError(
      400,
      `En polidocencia (3°–6°) cada docente atiende como máximo ${MAX_POLIDOCENCIA_SECTIONS} salones`,
    );
  }
}

export async function assertTeacherActive(profesorId: bigint, tx: Prisma.TransactionClient = prisma) {
  const teacher = await tx.teacher.findUnique({ where: { id: profesorId } });
  if (!teacher?.activo) throw new AppError(404, "Profesor no encontrado o inactivo");
  return teacher;
}

export async function assertNoOtherTeacherForCourse(
  cursoId: bigint,
  seccionId: bigint,
  anioLectivoId: bigint,
  profesorId: bigint,
  tx: Prisma.TransactionClient = prisma,
) {
  const other = await tx.teacherCourseAssignment.findFirst({
    where: {
      cursoId,
      seccionId,
      anioLectivoId,
      activo: true,
      profesorId: { not: profesorId },
    },
  });
  if (other) {
    throw new AppError(
      409,
      "Ya existe otro profesor asignado a este curso en la misma sección y año lectivo",
    );
  }
}

export async function assertSingleTutor(
  seccionId: bigint,
  anioLectivoId: bigint,
  profesorId: bigint,
  tx: Prisma.TransactionClient = prisma,
) {
  const tutor = await tx.tutorSeccion.findUnique({
    where: { seccionId_anioLectivoId: { seccionId, anioLectivoId } },
  });
  if (tutor?.activo && tutor.profesorId !== profesorId) {
    throw new AppError(409, "Ya existe un tutor asignado a esta sección en el año lectivo");
  }
}

export async function assertNoActiveDuplicateAssignment(
  tx: Prisma.TransactionClient,
  profesorId: bigint,
  cursoId: bigint,
  seccionId: bigint,
  anioLectivoId: bigint,
) {
  const existing = await tx.teacherCourseAssignment.findUnique({
    where: {
      profesorId_cursoId_seccionId_anioLectivoId: {
        profesorId,
        cursoId,
        seccionId,
        anioLectivoId,
      },
    },
  });
  if (existing?.activo) {
    throw new AppError(409, "Asignación activa duplicada para este profesor, curso y sección");
  }
  return existing;
}
