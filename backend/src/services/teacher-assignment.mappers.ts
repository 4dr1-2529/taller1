import type { Prisma } from "@prisma/client";
import { idToString } from "../utils/ids.js";

export const assignmentInclude = {
  curso: { select: { id: true, codigo: true, nombre: true } },
  grado: { select: { id: true, numero: true, nombre: true } },
  seccion: { select: { id: true, nombre: true } },
  profesor: { select: { id: true, nombres: true, apellidos: true, codigo: true } },
  anioLectivo: { select: { id: true, anio: true, nombre: true } },
} as const;

export type AssignmentRow = Prisma.TeacherCourseAssignmentGetPayload<{
  include: typeof assignmentInclude;
}>;

export function mapAssignmentRow(row: AssignmentRow) {
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
    profesor: mapProfesor(row.profesor),
    curso: row.curso ? { ...row.curso, id: idToString(row.curso.id) } : undefined,
    grado: row.grado
      ? { ...row.grado, id: idToString(row.grado.id), label: `${row.grado.numero}°` }
      : undefined,
    seccion: mapSeccion(row),
    anioLectivo: row.anioLectivo
      ? { ...row.anioLectivo, id: idToString(row.anioLectivo.id) }
      : undefined,
    tipoAsignacion: row.esTutor ? "Tutor de aula" : "Docente por curso",
  };
}

function mapProfesor(
  profesor: AssignmentRow["profesor"],
) {
  if (!profesor) return undefined;
  return {
    ...profesor,
    id: idToString(profesor.id),
    nombre: `${profesor.nombres} ${profesor.apellidos}`,
  };
}

function mapSeccion(row: AssignmentRow) {
  if (!row.seccion) return undefined;
  const label = row.grado
    ? `${row.grado.numero}° ${row.seccion.nombre}`
    : row.seccion.nombre;
  return { ...row.seccion, id: idToString(row.seccion.id), label };
}

export function resolveTipoPrincipal(
  assignments: Array<{ esTutor: boolean; grado: { numero: number } }>,
): string {
  if (assignments.length === 0) return "Docente por curso";
  const hasTutor = assignments.some((a) => a.esTutor);
  if (!hasTutor) return "Docente por curso";
  const allPrimaryGrades = assignments.every((a) => a.grado.numero <= 2);
  if (allPrimaryGrades) return "Tutor de aula";
  return "Tutor y docente por curso";
}
