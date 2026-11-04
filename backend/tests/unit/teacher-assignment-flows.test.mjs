import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";
import { createCourseAssignment, deactivateAssignment } from "../../src/services/teacher-assignment.service.js";

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
