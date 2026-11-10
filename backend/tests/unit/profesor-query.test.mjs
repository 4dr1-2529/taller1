import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import {
  buildProfesorStudentWhere,
  getTeacherCourseSectionIds,
  parseProfesorQuery,
  requireTeacherIdFromUser,
} from "../../src/utils/profesor-query.js";

function replaceMethod(object, method, implementation) {
  const original = object[method];
  object[method] = implementation;
  return () => { object[method] = original; };
}

test("parseProfesorQuery normaliza filtros y prioriza search sobre q", () => {
  assert.deepEqual(parseProfesorQuery({
    query: { gradoId: "2", seccionId: "3", cursoId: "4", search: "Ana", q: "fallback" },
  }), { gradoId: "2", seccionId: "3", cursoId: "4", search: "Ana" });
});

test("parseProfesorQuery usa q como alias y deja filtros vacíos como undefined", () => {
  assert.deepEqual(parseProfesorQuery({ query: { gradoId: "", seccionId: "", cursoId: "", q: " Paz " } }), {
    gradoId: undefined,
    seccionId: undefined,
    cursoId: undefined,
    search: " Paz ",
  });
  assert.deepEqual(parseProfesorQuery({ query: {} }), {
    gradoId: undefined,
    seccionId: undefined,
    cursoId: undefined,
    search: undefined,
  });
});

test("requireTeacherIdFromUser devuelve el perfil enlazado y rechaza el que falta", async () => {
  const restore = replaceMethod(prisma.teacher, "findFirst", async () => ({ id: 7n }));
  try {
    assert.equal(await requireTeacherIdFromUser("42"), 7n);
  } finally {
    restore();
  }

  const restoreMissing = replaceMethod(prisma.teacher, "findFirst", async () => null);
  try {
    await assert.rejects(requireTeacherIdFromUser("42"), { message: "TEACHER_NOT_LINKED" });
  } finally {
    restoreMissing();
  }
});

test("getTeacherCourseSectionIds conserva todas las secciones sin filtros y restringe filtros a asignaciones propias", async () => {
  let calls = 0;
  const restore = replaceMethod(prisma.teacherCourseAssignment, "findMany", async () => {
    calls += 1;
    if (calls === 1) return [{ seccionId: 10n }, { seccionId: 20n }];
    if (calls === 2) return [{ seccionId: 20n }, { seccionId: 30n }];
    return [{ seccionId: 30n }, { seccionId: 40n }, { seccionId: 30n }];
  });
  try {
    assert.deepEqual(await getTeacherCourseSectionIds(5n, {}), [10n, 20n]);
    assert.deepEqual(await getTeacherCourseSectionIds(5n, { seccionId: "3" }), [30n]);
    assert.equal(calls, 3);
  } finally {
    restore();
  }
});

test("buildProfesorStudentWhere devuelve conjunto vacío cuando no hay secciones ni cursos asignados", async () => {
  let calls = 0;
  const restore = replaceMethod(prisma.teacherCourseAssignment, "findMany", async () => {
    calls += 1;
    return calls === 1 ? [] : [{ cursoOfertaId: null }];
  });
  try {
    assert.deepEqual(await buildProfesorStudentWhere(5n, {}), { id: { in: [] } });
    assert.deepEqual(await buildProfesorStudentWhere(5n, {}), { id: { in: [] } });
    assert.equal(calls, 3);
  } finally {
    restore();
  }
});

test("buildProfesorStudentWhere exige matrícula y curso activos e incluye búsqueda normalizada", async () => {
  let assignmentCalls = 0;
  const restoreAssignments = replaceMethod(prisma.teacherCourseAssignment, "findMany", async () => {
    assignmentCalls += 1;
    if (assignmentCalls === 1) return [{ seccionId: 10n }, { seccionId: 10n }];
    if (assignmentCalls === 2) return [{ seccionId: 10n }, { seccionId: 11n }];
    return [{ cursoOfertaId: 101n }, { cursoOfertaId: null }, { cursoOfertaId: 102n }];
  });
  const restoreYear = replaceMethod(prisma.anioLectivo, "findFirst", async () => ({ id: 2026n }));
  try {
    assert.deepEqual(await buildProfesorStudentWhere(5n, { cursoId: "25", search: "  Ana  " }), {
      activo: true,
      seccionId: { in: [10n] },
      matriculas: { some: { estado: "activa", anioLectivoId: 2026n } },
      inscripciones: { some: { cursoOfertaId: { in: [101n, 102n] }, estado: "activa" } },
      OR: [
        { nombres: { contains: "Ana" } },
        { apellidos: { contains: "Ana" } },
        { codigo: { contains: "Ana" } },
      ],
    });
    assert.equal(assignmentCalls, 3);
  } finally {
    restoreAssignments();
    restoreYear();
  }
});
