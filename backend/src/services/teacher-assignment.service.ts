/**
 * Asignación docente institucional:
 * - 1° y 2°: tutor dicta todos los cursos del aula (esTutor=true)
 * - 3° a 6°: polidocencia — 2 cursos por docente, máx. 6 salones distintos
 */
import type { Prisma } from "@prisma/client";
import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../utils/prisma.js";
import { toDbId, idToString } from "../utils/ids.js";
import { getActiveAnioLectivoId } from "../utils/academic-period.js";
import {
  buildCourseCodigoForSeccion,
  requireActiveSeccion,
  type SeccionWithGrado,
} from "../utils/course-section.js";

export type AssignmentFilters = {
  profesorId?: string;
  cursoId?: string;
  gradoId?: string;
  seccionId?: string;
  anioLectivoId?: string;
  esTutor?: boolean;
  activo?: boolean;
};

export type CreateAssignmentInput = {
  profesorId: string;
  cursoId: string;
  seccionId: string;
  anioLectivoId?: string;
  esTutor?: boolean;
};

export type CreateTutorInput = {
  profesorId: string;
  seccionId: string;
  anioLectivoId?: string;
};

function isTutorGrade(numero: number): boolean {
  return numero >= 1 && numero <= 2;
}

export const MAX_POLIDOCENCIA_COURSES = 2;
export const MAX_POLIDOCENCIA_SECTIONS = 6;

async function assertPolidocenciaTeacherLimits(
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

async function assertTeacherActive(profesorId: bigint, tx: Prisma.TransactionClient = prisma) {
  const t = await tx.teacher.findFirst({ where: { id: profesorId, activo: true } });
  if (!t) throw new AppError(404, "Profesor no encontrado o inactivo");
  return t;
}

async function assertNoOtherTeacherForCourse(
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

async function assertSingleTutor(
  seccionId: bigint,
  anioLectivoId: bigint,
  profesorId: bigint,
  tx: Prisma.TransactionClient = prisma,
) {
  const tutor = await tx.tutorSeccion.findFirst({
    where: { seccionId, anioLectivoId, activo: true },
  });
  if (tutor && tutor.profesorId !== profesorId) {
    throw new AppError(409, "Ya existe un tutor asignado a esta sección en el año lectivo");
  }
}

/** Sincroniza curso_oferta con la asignación activa. */
export async function syncCourseOffering(
  assignment: {
    id: bigint;
    profesorId: bigint;
    cursoId: bigint;
    seccionId: bigint;
    anioLectivoId: bigint;
    activo: boolean;
  },
  seccion?: SeccionWithGrado,
  tx: Prisma.TransactionClient = prisma,
) {
  const sec =
    seccion ??
    (await tx.seccion.findFirstOrThrow({
      where: { id: assignment.seccionId },
      include: { grado: { include: { nivel: true } } },
    }));

  const catalog = await tx.cursoCatalogo.findUniqueOrThrow({
    where: { id: assignment.cursoId },
    select: { codigo: true },
  });

  const codigo = buildCourseCodigoForSeccion(catalog.codigo, sec);

  const offering = await tx.course.upsert({
    where: {
      cursoId_seccionId_anioLectivoId: {
        cursoId: assignment.cursoId,
        seccionId: assignment.seccionId,
        anioLectivoId: assignment.anioLectivoId,
      },
    },
    create: {
      codigo,
      cursoId: assignment.cursoId,
      seccionId: assignment.seccionId,
      profesorId: assignment.profesorId,
      anioLectivoId: assignment.anioLectivoId,
      activo: assignment.activo,
    },
    update: {
      profesorId: assignment.profesorId,
      activo: assignment.activo,
      codigo,
    },
  });

  await tx.teacherCourseAssignment.update({
    where: { id: assignment.id },
    data: { cursoOfertaId: offering.id },
  });

  return offering;
}

/** Asignar tutor a 1° o 2° — todos los cursos del grado en esa sección. */
export async function assignTutorToSection(input: CreateTutorInput) {
  const anioLectivoId = input.anioLectivoId
    ? toDbId(input.anioLectivoId)
    : await getActiveAnioLectivoId();
  const profesorId = toDbId(input.profesorId);
  const seccion = await requireActiveSeccion(input.seccionId);

  if (!isTutorGrade(seccion.grado.numero)) {
    throw new AppError(400, "El tutor de aula solo aplica a 1° y 2° grado");
  }

  return prisma.$transaction(async (tx) => {
    await assertTeacherActive(profesorId, tx);
    await assertSingleTutor(seccion.id, anioLectivoId, profesorId, tx);

    await tx.tutorSeccion.upsert({
      where: { seccionId_anioLectivoId: { seccionId: seccion.id, anioLectivoId } },
      create: { seccionId: seccion.id, profesorId, anioLectivoId, activo: true },
      update: { profesorId, activo: true },
    });

    const cursosGrado = await tx.cursoGrado.findMany({
      where: { gradoId: seccion.gradoId },
      select: { cursoId: true },
    });

    const assignments = [];
    for (const cg of cursosGrado) {
      await assertNoOtherTeacherForCourse(
        cg.cursoId,
        seccion.id,
        anioLectivoId,
        profesorId,
        tx,
      );

      const row = await tx.teacherCourseAssignment.upsert({
        where: {
          profesorId_cursoId_seccionId_anioLectivoId: {
            profesorId,
            cursoId: cg.cursoId,
            seccionId: seccion.id,
            anioLectivoId,
          },
        },
        create: {
          profesorId,
          cursoId: cg.cursoId,
          gradoId: seccion.gradoId,
          seccionId: seccion.id,
          anioLectivoId,
          esTutor: true,
          activo: true,
        },
        update: { esTutor: true, activo: true, gradoId: seccion.gradoId },
      });

      await syncCourseOffering(row, seccion, tx);
      assignments.push(row);
    }

    return { tutor: true, totalCursos: assignments.length, seccionId: idToString(seccion.id) };
  });
}

/** Asignar docente por curso (3°–6° polidocencia). */
export async function createCourseAssignment(input: CreateAssignmentInput) {
  const anioLectivoId = input.anioLectivoId
    ? toDbId(input.anioLectivoId)
    : await getActiveAnioLectivoId();
  const profesorId = toDbId(input.profesorId);
  const cursoId = toDbId(input.cursoId);
  const seccion = await requireActiveSeccion(input.seccionId);
  const esTutor = input.esTutor ?? false;

  if (isTutorGrade(seccion.grado.numero) && !esTutor) {
    throw new AppError(
      400,
      "En 1° y 2° use asignación de tutor de aula (dicta todos los cursos)",
    );
  }
  if (!isTutorGrade(seccion.grado.numero) && esTutor) {
    throw new AppError(400, "esTutor solo aplica a 1° y 2° grado");
  }

  return prisma.$transaction(async (tx) => {
    await assertTeacherActive(profesorId, tx);
    await assertNoOtherTeacherForCourse(cursoId, seccion.id, anioLectivoId, profesorId, tx);
    await assertPolidocenciaTeacherLimits(
      profesorId,
      cursoId,
      seccion.id,
      anioLectivoId,
      seccion.grado.numero,
      tx,
    );

    if (esTutor) {
      await assertSingleTutor(seccion.id, anioLectivoId, profesorId, tx);
      await tx.tutorSeccion.upsert({
        where: { seccionId_anioLectivoId: { seccionId: seccion.id, anioLectivoId } },
        create: { seccionId: seccion.id, profesorId, anioLectivoId, activo: true },
        update: { profesorId, activo: true },
      });
    }

    const existing = await tx.teacherCourseAssignment.findUnique({
      where: {
        profesorId_cursoId_seccionId_anioLectivoId: {
          profesorId,
          cursoId,
          seccionId: seccion.id,
          anioLectivoId,
        },
      },
    });
    if (existing?.activo) {
      throw new AppError(409, "Asignación activa duplicada para este profesor, curso y sección");
    }

    const row = await tx.teacherCourseAssignment.upsert({
      where: {
        profesorId_cursoId_seccionId_anioLectivoId: {
          profesorId,
          cursoId,
          seccionId: seccion.id,
          anioLectivoId,
        },
      },
      create: {
        profesorId,
        cursoId,
        gradoId: seccion.gradoId,
        seccionId: seccion.id,
        anioLectivoId,
        esTutor,
        activo: true,
      },
      update: { esTutor, activo: true, gradoId: seccion.gradoId },
    });

    await syncCourseOffering(row, seccion, tx);
    const full = await tx.teacherCourseAssignment.findUniqueOrThrow({
      where: { id: row.id },
      include: assignmentInclude,
    });
    return mapAssignmentRow(full);
  });
}

function mapAssignmentRow(
  row: Prisma.TeacherCourseAssignmentGetPayload<{
    include: {
      curso: { select: { id: true; codigo: true; nombre: true } };
      grado: { select: { id: true; numero: true; nombre: true } };
      seccion: { select: { id: true; nombre: true } };
      profesor: { select: { id: true; nombres: true; apellidos: true; codigo: true } };
      anioLectivo: { select: { id: true; anio: true; nombre: true } };
    };
  }>,
) {
  return {
    id: idToString(row.id),
    profesorId: idToString(row.profesorId),
    cursoId: idToString(row.cursoId),
    gradoId: idToString(row.gradoId),
    seccionId: idToString(row.seccionId),
    anioLectivoId: idToString(row.anioLectivoId),
    cursoOfertaId: row.cursoOfertaId ? idToString(row.cursoOfertaId) : null,
    esTutor: row.esTutor,
    activo: row.activo,
    profesor: row.profesor
      ? {
          ...row.profesor,
          id: idToString(row.profesor.id),
          nombre: `${row.profesor.nombres} ${row.profesor.apellidos}`,
        }
      : undefined,
    curso: row.curso
      ? { ...row.curso, id: idToString(row.curso.id) }
      : undefined,
    grado: row.grado
      ? { ...row.grado, id: idToString(row.grado.id), label: `${row.grado.numero}°` }
      : undefined,
    seccion: row.seccion
      ? {
          ...row.seccion,
          id: idToString(row.seccion.id),
          label: row.grado
            ? `${row.grado.numero}° ${row.seccion.nombre}`
            : row.seccion.nombre,
        }
      : undefined,
    anioLectivo: row.anioLectivo
      ? { ...row.anioLectivo, id: idToString(row.anioLectivo.id) }
      : undefined,
    tipoAsignacion: row.esTutor ? "Tutor de aula" : "Docente por curso",
  };
}

const assignmentInclude = {
  curso: { select: { id: true, codigo: true, nombre: true } },
  grado: { select: { id: true, numero: true, nombre: true } },
  seccion: { select: { id: true, nombre: true } },
  profesor: { select: { id: true, nombres: true, apellidos: true, codigo: true } },
  anioLectivo: { select: { id: true, anio: true, nombre: true } },
} as const;

export async function listAssignments(filters: AssignmentFilters = {}) {
  const where: Prisma.TeacherCourseAssignmentWhereInput = {
    activo: filters.activo ?? true,
  };
  if (filters.profesorId) where.profesorId = toDbId(filters.profesorId);
  if (filters.cursoId) where.cursoId = toDbId(filters.cursoId);
  if (filters.gradoId) where.gradoId = toDbId(filters.gradoId);
  if (filters.seccionId) where.seccionId = toDbId(filters.seccionId);
  if (filters.anioLectivoId) where.anioLectivoId = toDbId(filters.anioLectivoId);
  if (filters.esTutor !== undefined) where.esTutor = filters.esTutor;

  const rows = await prisma.teacherCourseAssignment.findMany({
    where,
    include: assignmentInclude,
    orderBy: [
      { profesor: { apellidos: "asc" } },
      { grado: { numero: "asc" } },
      { seccion: { nombre: "asc" } },
      { curso: { nombre: "asc" } },
    ],
    take: 500,
  });

  return rows.map((r) => mapAssignmentRow(r));
}

export async function getAssignmentById(id: string) {
  const row = await prisma.teacherCourseAssignment.findUnique({
    where: { id: toDbId(id) },
    include: assignmentInclude,
  });
  if (!row) throw new AppError(404, "Asignación no encontrada");
  return mapAssignmentRow(row);
}

export async function deactivateAssignment(id: string) {
  const row = await prisma.teacherCourseAssignment.findUnique({ where: { id: toDbId(id) } });
  if (!row) throw new AppError(404, "Asignación no encontrada");

  await prisma.$transaction(async (tx) => {
    await tx.teacherCourseAssignment.update({
      where: { id: row.id },
      data: { activo: false },
    });
    if (row.cursoOfertaId) {
      const grades = await tx.grade.count({ where: { cursoOfertaId: row.cursoOfertaId } });
      if (grades === 0) {
        await tx.course.update({
          where: { id: row.cursoOfertaId },
          data: { activo: false },
        });
      }
    }
    if (row.esTutor) {
      const activeTutorCourses = await tx.teacherCourseAssignment.count({
        where: {
          seccionId: row.seccionId,
          anioLectivoId: row.anioLectivoId,
          esTutor: true,
          activo: true,
          profesorId: row.profesorId,
        },
      });
      if (activeTutorCourses === 0) {
        await tx.tutorSeccion.updateMany({
          where: {
            seccionId: row.seccionId,
            anioLectivoId: row.anioLectivoId,
            profesorId: row.profesorId,
          },
          data: { activo: false },
        });
      }
    }
  });

  return { id, activo: false };
}

export async function assertTeacherAssignmentAccess(
  profesorId: bigint,
  cursoOfertaId: bigint,
): Promise<void> {
  const course = await prisma.course.findFirst({
    where: { id: cursoOfertaId, activo: true },
    select: { cursoId: true, seccionId: true, anioLectivoId: true },
  });
  if (!course) throw new AppError(404, "Curso no encontrado");

  const assignment = await prisma.teacherCourseAssignment.findFirst({
    where: {
      profesorId,
      cursoId: course.cursoId,
      seccionId: course.seccionId,
      anioLectivoId: course.anioLectivoId,
      activo: true,
    },
  });
  if (!assignment) {
    throw new AppError(403, "No está asignado a este curso en esta sección", "FORBIDDEN");
  }
}

export async function getTeacherWorkload(profesorId: bigint) {
  const assignments = await prisma.teacherCourseAssignment.findMany({
    where: { profesorId, activo: true },
    include: {
      curso: { select: { id: true, codigo: true, nombre: true } },
      grado: { select: { id: true, numero: true, nombre: true } },
      seccion: { select: { id: true, nombre: true } },
    },
    orderBy: [{ grado: { numero: "asc" } }, { seccion: { nombre: "asc" } }],
  });

  const cursosMap = new Map<string, { id: string; nombre: string; codigo: string }>();
  const seccionesSet = new Set<string>();
  const gradosSet = new Set<number>();
  let esTutor = false;

  for (const a of assignments) {
    cursosMap.set(idToString(a.cursoId), {
      id: idToString(a.cursoId),
      nombre: a.curso.nombre,
      codigo: a.curso.codigo,
    });
    seccionesSet.add(`${a.grado.numero}° ${a.seccion.nombre}`);
    gradosSet.add(a.grado.numero);
    if (a.esTutor) esTutor = true;
  }

  const sectionIds = [...new Set(assignments.map((a) => a.seccionId))];
  const totalAlumnos = sectionIds.length
    ? await prisma.student.count({
        where: { seccionId: { in: sectionIds }, activo: true },
      })
    : 0;

  const tipoPrincipal =
    assignments.some((a) => a.esTutor) && assignments.every((a) => a.grado.numero <= 2)
      ? "Tutor de aula"
      : assignments.some((a) => a.esTutor)
        ? "Tutor y docente por curso"
        : "Docente por curso";

  const poliAssignments = assignments.filter((a) => !a.esTutor && a.grado.numero >= 3);
  const poliCourseIds = new Set(poliAssignments.map((a) => idToString(a.cursoId)));
  const poliSectionIds = new Set(poliAssignments.map((a) => idToString(a.seccionId)));

  return {
    tipoAsignacion: tipoPrincipal,
    esTutor,
    cursos: [...cursosMap.values()],
    grados: [...gradosSet].sort((a, b) => a - b).map((n) => `${n}°`),
    secciones: [...seccionesSet].sort(),
    cargaAcademica: assignments.length,
    totalAlumnos,
    polidocencia: {
      cursosDistintos: poliCourseIds.size,
      maxCursos: MAX_POLIDOCENCIA_COURSES,
      salonesDistintos: poliSectionIds.size,
      maxSalones: MAX_POLIDOCENCIA_SECTIONS,
    },
    asignaciones: assignments.map((a) => ({
      curso: a.curso.nombre,
      salon: `${a.grado.numero}° ${a.seccion.nombre}`,
      esTutor: a.esTutor,
    })),
  };
}

export async function countActiveAssignmentsForTeacher(profesorId: bigint): Promise<number> {
  return prisma.teacherCourseAssignment.count({
    where: { profesorId, activo: true },
  });
}
