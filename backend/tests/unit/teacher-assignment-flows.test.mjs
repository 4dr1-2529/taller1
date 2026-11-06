import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { createCourseAssignment, assignTutorToSection, deactivateAssignment, assertTeacherAssignmentAccess } from "../../src/services/teacher-assignment.service.js";

function replace(target, key, implementation, restore) {
  const original = target[key]; target[key] = implementation;
  restore.push(() => { target[key] = original; });
}

test("createCourseAssignment valida límites y persiste una asignación 2026 con oferta", async () => {
  const restore = [];
  const calls = { updates: [], offers: [], enrollments: [], assignment: null };
  const section = { id: 40n, gradoId: 4n, nombre: "A", activo: true, grado: { id: 4n, numero: 4, nombre: "Cuarto", nivel: { codigo: "secundaria" } } };
  const row = { id: 51n, profesorId: 8n, cursoId: 9n, gradoId: 4n, seccionId: 40n, anioLectivoId: 2026n, cursoOfertaId: 90n, esTutor: false, activo: true };
  const full = { ...row, profesor: { id: 8n, nombres: "Luis", apellidos: "Sol", codigo: "P8" }, curso: { id: 9n, codigo: "MAT", nombre: "Matemática" }, grado: { id: 4n, numero: 4, nombre: "Cuarto" }, seccion: { id: 40n, nombre: "A" }, anioLectivo: { id: 2026n, anio: 2026, nombre: "2026" } };
  const tx = {
    teacher: { findUnique: async () => ({ id: 8n, activo: true }) },
    teacherCourseAssignment: {
      findMany: async () => [], findFirst: async () => null, findUnique: async () => null,
      upsert: async () => row,
      update: async (args) => calls.updates.push(args),
      findUniqueOrThrow: async () => full,
    },
    course: { upsert: async (args) => { calls.offers.push(args); return { id: 90n }; } },
    cursoCatalogo: { findUniqueOrThrow: async () => ({ codigo: "MAT" }) },
    matricula: { findMany: async () => [{ estudianteId: 101n } ] },
    enrollment: { createMany: async (args) => calls.enrollments.push(args) },
  };
  replace(prisma.seccion, "findFirst", async () => section, restore);
  replace(prisma.anioLectivo, "findFirst", async () => ({ id: 2026n, anio: 2026, activo: true }), restore);
  replace(prisma, "$transaction", async (callback) => callback(tx), restore);
  try {
    const result = await createCourseAssignment({ profesorId: "8", cursoId: "9", seccionId: "40" });
    assert.strictEqual(result.id, "51");
    assert.strictEqual(result.profesor.nombre, "Luis Sol");
    assert.strictEqual(result.tipoAsignacion, "Docente por curso");
    assert.strictEqual(calls.offers[0].create.codigo, "MAT-4A");
    assert.deepStrictEqual(calls.enrollments[0].data, [{ studentId: 101n, cursoOfertaId: 90n }]);
    assert.deepStrictEqual(calls.updates[0].data, { cursoOfertaId: 90n });
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("createCourseAssignment aplica la regla tutor y rechaza años inactivos", async (t) => {
  const restore = [];
  const section = { id: 40n, gradoId: 2n, nombre: "B", grado: { id: 2n, numero: 2, nombre: "Segundo" } };
  replace(prisma.seccion, "findFirst", async () => section, restore);
  replace(prisma.anioLectivo, "findFirst", async () => ({ id: 2026n, anio: 2026, activo: true }), restore);
  try {
    await assert.rejects(createCourseAssignment({ profesorId: "8", cursoId: "9", seccionId: "40" }), /use asignación de tutor/);
  } finally { restore.reverse().forEach((fn) => fn()); }

  const restoreYear = [];
  replace(prisma.seccion, "findFirst", async () => ({ ...section, grado: { ...section.grado, numero: 4 } }), restoreYear);
  replace(prisma.anioLectivo, "findFirst", async () => null, restoreYear);
  try {
    await assert.rejects(createCourseAssignment({ profesorId: "8", cursoId: "9", seccionId: "40" }), /No hay año lectivo activo/);
  } finally { restoreYear.reverse().forEach((fn) => fn()); }
});

test("assignTutorToSection crea tutorías y cursos de la sección activa", async () => {
  const calls = { tutor: [], assignments: [], offerings: [], enrollments: [] };
  const section = { id: 40n, gradoId: 2n, nombre: "B", activo: true, grado: { id: 2n, numero: 2, nombre: "Segundo", nivel: { codigo: "primaria" } } };
  const assignment = { id: 61n, profesorId: 8n, cursoId: 9n, gradoId: 2n, seccionId: 40n, anioLectivoId: 2026n, cursoOfertaId: 90n, esTutor: true, activo: true };
  const tx = {
    teacher: { findUnique: async () => ({ id: 8n, activo: true }) },
    tutorSeccion: {
      findUnique: async () => null,
      upsert: async (args) => calls.tutor.push(args),
    },
    cursoGrado: { findMany: async () => [{ cursoId: 9n }] },
    teacherCourseAssignment: {
      findFirst: async () => null,
      findUnique: async () => null,
      upsert: async (args) => { calls.assignments.push(args); return assignment; },
      update: async () => undefined,
      findUniqueOrThrow: async () => assignment,
    },
    cursoCatalogo: { findUniqueOrThrow: async () => ({ codigo: "MAT" }) },
    course: { upsert: async (args) => { calls.offerings.push(args); return { id: 90n }; } },
    matricula: { findMany: async () => [{ estudianteId: 101n }] },
    enrollment: { createMany: async (args) => calls.enrollments.push(args) },
  };
  const restore = [];
  replace(prisma.seccion, "findFirst", async () => section, restore);
  replace(prisma.anioLectivo, "findFirst", async () => ({ id: 2026n, anio: 2026, activo: true }), restore);
  replace(prisma, "$transaction", async (callback) => callback(tx), restore);
  try {
    assert.deepEqual(await assignTutorToSection({ profesorId: "8", seccionId: "40" }), {
      tutor: true, totalCursos: 1, seccionId: "40",
    });
    assert.equal(calls.tutor.length, 1);
    assert.equal(calls.assignments[0].create.esTutor, true);
    assert.equal(calls.offerings[0].create.codigo, "MAT-2B");
    assert.deepEqual(calls.enrollments[0].data, [{ studentId: 101n, cursoOfertaId: 90n }]);
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("deactivateAssignment revoca la asignación y oferta sin notas históricas; 404 si no existe", async () => {
  const restore = [];
  const calls = { assignment: [], offer: [] };
  const row = { id: 51n, cursoOfertaId: 90n, esTutor: false, seccionId: 40n, anioLectivoId: 2026n, profesorId: 8n };
  replace(prisma.teacherCourseAssignment, "findUnique", async () => row, restore);
  replace(prisma, "$transaction", async (callback) => callback({
    teacherCourseAssignment: { update: async (args) => calls.assignment.push(args) },
    grade: { count: async () => 0 },
    course: { update: async (args) => calls.offer.push(args) },
  }), restore);
  try {
    assert.deepStrictEqual(await deactivateAssignment("51"), { id: "51", activo: false });
    assert.deepStrictEqual(calls.assignment[0].data, { activo: false });
    assert.deepStrictEqual(calls.offer[0], { where: { id: 90n }, data: { activo: false } });
  } finally { restore.reverse().forEach((fn) => fn()); }

  const restoreMissing = [];
  replace(prisma.teacherCourseAssignment, "findUnique", async () => null, restoreMissing);
  try { await assert.rejects(deactivateAssignment("51"), (error) => error.statusCode === 404); }
  finally { restoreMissing.reverse().forEach((fn) => fn()); }
});
import { reassignCourseOffering } from "../../src/services/teacher-assignment.service.js";

test("reassignCourseOffering actualiza la asignación existente y sincroniza la oferta activa", async () => {
  const calls = { updates: [], offerUpdates: [], enrollments: [] };
  const offering = { id: 90n, cursoId: 9n, seccionId: 40n, anioLectivoId: 2026n, activo: true };
  const section = { id: 40n, gradoId: 4n, nombre: "A", grado: { numero: 4, nombre: "Cuarto", nivel: { codigo: "secundaria" } } };
  const assignment = { id: 51n, profesorId: 8n, cursoId: 9n, gradoId: 4n, seccionId: 40n, anioLectivoId: 2026n, cursoOfertaId: 90n, esTutor: false, activo: true };
  const full = { ...assignment, profesor: { id: 8n, nombres: "Luis", apellidos: "Sol", codigo: "P8" }, curso: { id: 9n, codigo: "MAT", nombre: "Matemática" }, grado: { id: 4n, numero: 4, nombre: "Cuarto" }, seccion: { id: 40n, nombre: "A" }, anioLectivo: { id: 2026n, anio: 2026, nombre: "2026" } };
  const tx = {
    course: {
      findUniqueOrThrow: async () => offering,
      upsert: async (args) => { calls.offerUpdates.push(args); return { id: 90n }; },
    },
    anioLectivo: { findUniqueOrThrow: async () => ({ anio: 2026, activo: true }) },
    teacher: { findUnique: async () => ({ id: 8n, activo: true }) },
    seccion: { findUniqueOrThrow: async () => section },
    teacherCourseAssignment: {
      findMany: async () => [{ ...assignment, profesorId: 7n, activo: true }],
      update: async (args) => calls.updates.push(args),
      findUnique: async () => assignment,
      findUniqueOrThrow: async () => full,
      upsert: async () => assignment,
    },
    tutorSeccion: { upsert: async () => undefined },
    cursoCatalogo: { findUniqueOrThrow: async () => ({ codigo: "MAT" }) },
    matricula: { findMany: async () => [{ estudianteId: 101n }] },
    enrollment: { createMany: async (args) => calls.enrollments.push(args) },
    grade: { count: async () => 0 },
  };
  const restore = [];
  replace(prisma, "$transaction", async (callback) => callback(tx), restore);
  try {
    const result = await reassignCourseOffering(90n, 8n);
    assert.deepStrictEqual(result.previousTeacherIds, [7n]);
    assert.strictEqual(result.item.profesor.nombre, "Luis Sol");
    assert.strictEqual(result.item.tipoAsignacion, "Docente por curso");
    assert.deepStrictEqual(calls.updates[0].data, { profesorId: 8n, gradoId: 4n, esTutor: false, activo: true });
    assert.strictEqual(calls.offerUpdates[0].update.codigo, "MAT-4A");
    assert.deepStrictEqual(calls.enrollments[0].data, [{ studentId: 101n, cursoOfertaId: 90n }]);
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("reassignCourseOffering rechaza oferta inactiva y año histórico antes de reasignar", async (t) => {
  const inactive = { course: { findUniqueOrThrow: async () => ({ activo: false }) } };
  const restoreInactive = [];
  replace(prisma, "$transaction", async (callback) => callback(inactive), restoreInactive);
  try { await assert.rejects(reassignCourseOffering(90n, 8n), /Curso no encontrado o inactivo/); }
  finally { restoreInactive.reverse().forEach((fn) => fn()); }

  const historical = {
    course: { findUniqueOrThrow: async () => ({ id: 90n, activo: true, anioLectivoId: 2025n }) },
    anioLectivo: { findUniqueOrThrow: async () => ({ anio: 2025, activo: false }) },
  };
  const restoreHistorical = [];
  replace(prisma, "$transaction", async (callback) => callback(historical), restoreHistorical);
  try { await assert.rejects(reassignCourseOffering(90n, 8n), /Solo reasignación en año activo 2026/); }
  finally { restoreHistorical.reverse().forEach((fn) => fn()); }
});

test("reassignCourseOffering crea una asignación faltante y admite una sección sin matrículas", async () => {
  const calls = { upsert: [], offering: [], enrollment: [] };
  const row = { id: 71n, profesorId: 8n, cursoId: 9n, gradoId: 4n, seccionId: 40n, anioLectivoId: 2026n, cursoOfertaId: 90n, esTutor: false, activo: true };
  const full = { ...row, profesor: { id: 8n, nombres: "Luis", apellidos: "Sol" }, curso: { id: 9n, codigo: "MAT", nombre: "Matemática" }, grado: { id: 4n, numero: 4, nombre: "Cuarto" }, seccion: { id: 40n, nombre: "A" }, anioLectivo: { id: 2026n, anio: 2026, nombre: "2026" } };
  const tx = {
    course: {
      findUniqueOrThrow: async () => ({ id: 90n, cursoId: 9n, seccionId: 40n, anioLectivoId: 2026n, activo: true }),
      upsert: async (args) => { calls.offering.push(args); return { id: 90n }; },
    },
    anioLectivo: { findUniqueOrThrow: async () => ({ anio: 2026, activo: true }) },
    teacher: { findUnique: async () => ({ id: 8n, activo: true }) },
    seccion: { findUniqueOrThrow: async () => ({ id: 40n, gradoId: 4n, nombre: "A", grado: { numero: 4, nombre: "Cuarto", nivel: { codigo: "secundaria" } } }) },
    teacherCourseAssignment: {
      findMany: async () => [],
      findUnique: async () => null,
      upsert: async (args) => { calls.upsert.push(args); return row; },
      update: async () => {},
      findUniqueOrThrow: async () => full,
    },
    cursoCatalogo: { findUniqueOrThrow: async () => ({ codigo: "MAT" }) },
    matricula: { findMany: async () => [] },
    enrollment: { createMany: async (args) => calls.enrollment.push(args) },
  };
  const restore = [];
  replace(prisma, "$transaction", async (callback) => callback(tx), restore);
  try {
    const result = await reassignCourseOffering(90n, 8n);
    assert.equal(result.item.id, "71");
    assert.deepEqual(result.previousTeacherIds, []);
    assert.equal(calls.upsert.length, 1);
    assert.deepEqual(calls.enrollment[0], { data: [], skipDuplicates: true });
  } finally { restore.reverse().forEach((fn) => fn()); }
});

test("deactivateAssignment conserva ofertas con notas o sin asignación vinculada", async () => {
  const restore = [];
  const courseUpdates = [];
  const tutorUpdates = [];
  const transaction = (row, gradeCount, remainingTutors) => async (callback) => callback({
    teacherCourseAssignment: {
      update: async () => {},
      count: async () => remainingTutors,
    },
    grade: { count: async () => gradeCount },
    course: { update: async (args) => courseUpdates.push(args) },
    tutorSeccion: { updateMany: async (args) => tutorUpdates.push(args) },
  });

  replace(prisma.teacherCourseAssignment, "findUnique", async () => ({ id: 51n, cursoOfertaId: null, esTutor: false, seccionId: 40n, anioLectivoId: 2026n, profesorId: 8n }), restore);
  replace(prisma, "$transaction", transaction(null, 0, 0), restore);
  try { await deactivateAssignment("51"); } finally { restore.reverse().forEach((fn) => fn()); }
  assert.equal(courseUpdates.length, 0);
  assert.equal(tutorUpdates.length, 0);

  replace(prisma.teacherCourseAssignment, "findUnique", async () => ({ id: 52n, cursoOfertaId: 90n, esTutor: true, seccionId: 40n, anioLectivoId: 2026n, profesorId: 8n }), restore);
  replace(prisma, "$transaction", transaction(null, 2, 1), restore);
  try { await deactivateAssignment("52"); } finally { restore.reverse().forEach((fn) => fn()); }
  assert.equal(courseUpdates.length, 0);
  assert.equal(tutorUpdates.length, 0);

  replace(prisma.teacherCourseAssignment, "findUnique", async () => ({ id: 53n, cursoOfertaId: 90n, esTutor: true, seccionId: 40n, anioLectivoId: 2026n, profesorId: 8n }), restore);
  replace(prisma, "$transaction", transaction(null, 0, 0), restore);
  try { await deactivateAssignment("53"); } finally { restore.reverse().forEach((fn) => fn()); }
  assert.equal(courseUpdates.length, 1);
  assert.equal(tutorUpdates.length, 1);
});

test("assertTeacherAssignmentAccess valida curso activo y asignación vigente", async (t) => {
  const course = { cursoId: 9n, seccionId: 40n, anioLectivoId: 2026n, activo: true };
  const scenarios = [
    { name: "rechaza curso inexistente", course: null, assignment: null, status: 404 },
    { name: "rechaza curso inactivo", course: { ...course, activo: false }, assignment: null, status: 404 },
    { name: "rechaza asignación inexistente", course, assignment: null, status: 403 },
    { name: "rechaza asignación inactiva", course, assignment: { activo: false }, status: 403 },
    { name: "acepta asignación activa", course, assignment: { activo: true } },
  ];
  for (const scenario of scenarios) {
    await t.test(scenario.name, async () => {
      const restore = [];
      replace(prisma.course, "findUnique", async () => scenario.course, restore);
      replace(prisma.teacherCourseAssignment, "findUnique", async () => scenario.assignment, restore);
      try {
        if (scenario.status) {
          await assert.rejects(assertTeacherAssignmentAccess(8n, 90n), (error) => error.statusCode === scenario.status);
        } else {
          await assertTeacherAssignmentAccess(8n, 90n);
        }
      } finally { restore.reverse().forEach((fn) => fn()); }
    });
  }
});

test("reasignar curso de tutor sincroniza la tutoría de sección", async () => {
  const calls = [];
  const assignment = { id: 61n, profesorId: 8n, cursoId: 9n, gradoId: 2n, seccionId: 40n, anioLectivoId: 2026n, cursoOfertaId: 90n, esTutor: true, activo: true };
  const full = {
    ...assignment,
    profesor: { id: 8n, nombres: "Ana", apellidos: "Paz" },
    curso: { id: 9n, codigo: "MAT", nombre: "Matemática" },
    grado: { id: 2n, numero: 2, nombre: "Segundo" },
    seccion: { id: 40n, nombre: "B" },
    anioLectivo: { id: 2026n, anio: 2026, nombre: "2026" },
  };
  const section = { id: 40n, gradoId: 2n, nombre: "B", grado: { numero: 2, nombre: "Segundo", nivel: { codigo: "primaria" } } };
  const tx = {
    course: {
      findUniqueOrThrow: async () => ({ id: 90n, cursoId: 9n, seccionId: 40n, anioLectivoId: 2026n, activo: true }),
      upsert: async () => ({ id: 90n }),
    },
    anioLectivo: { findUniqueOrThrow: async () => ({ anio: 2026, activo: true }) },
    teacher: { findUnique: async () => ({ id: 8n, activo: true }) },
    seccion: { findUniqueOrThrow: async () => section },
    teacherCourseAssignment: {
      findMany: async () => [assignment],
      findUnique: async () => assignment,
      update: async () => undefined,
      findUniqueOrThrow: async () => full,
    },
    tutorSeccion: { upsert: async (args) => calls.push(args) },
    cursoCatalogo: { findUniqueOrThrow: async () => ({ codigo: "MAT" }) },
    matricula: { findMany: async () => [] },
    enrollment: { createMany: async () => undefined },
  };
  const restore = [];
  replace(prisma, "$transaction", async (callback) => callback(tx), restore);
  try {
    const result = await reassignCourseOffering(90n, 8n);
    assert.equal(result.item.esTutor, true);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].create, { seccionId: 40n, profesorId: 8n, anioLectivoId: 2026n, activo: true });
  } finally { restore.reverse().forEach((fn) => fn()); }
});
