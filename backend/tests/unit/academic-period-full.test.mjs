import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/utils/prisma.js";

function mockPrisma(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = test.mock.fn(impl);
  return original;
}

const { getActiveAnioLectivoId, resolvePeriodoId, resolvePeriodoByParam } = await import("../../src/utils/academic-period.js");

test("academicPeriod: getActiveAnioLectivoId devuelve el año activo", async () => {
  const orig = mockPrisma(prisma.anioLectivo, "findFirst", async () => ({ id: 5n, anio: 2026, activo: true }));
  const result = await getActiveAnioLectivoId();
  assert.strictEqual(result, 5n);
  prisma.anioLectivo.findFirst = orig;
});

test("academicPeriod: getActiveAnioLectivoId lanza 400 si no hay año activo", async () => {
  const orig = mockPrisma(prisma.anioLectivo, "findFirst", async () => null);
  let error;
  try { await getActiveAnioLectivoId(); } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 400);
  prisma.anioLectivo.findFirst = orig;
});

test("academicPeriod: resolvePeriodoId con periodoId válido", async () => {
  const orig = mockPrisma(prisma.periodoAcademico, "findFirst", async () => ({ id: 8n }));
  const result = await resolvePeriodoId("8");
  assert.strictEqual(result, 8n);
  prisma.periodoAcademico.findFirst = orig;
});

test("academicPeriod: resolvePeriodoId con periodoId ajeno al año 2026 lanza 400", async () => {
  const orig = mockPrisma(prisma.periodoAcademico, "findFirst", async () => null);
  let error;
  try { await resolvePeriodoId("8"); } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 400);
  prisma.periodoAcademico.findFirst = orig;
});

test("academicPeriod: resolvePeriodoId con numero de periodo", async () => {
  const origGetActive = mockPrisma(prisma.anioLectivo, "findFirst", async () => ({ id: 5n }));
  const origFindPeriodo = mockPrisma(prisma.periodoAcademico, "findFirst", async () => ({ id: 9n }));
  const result = await resolvePeriodoId(undefined, 2);
  assert.strictEqual(result, 9n);
  prisma.anioLectivo.findFirst = origGetActive;
  prisma.periodoAcademico.findFirst = origFindPeriodo;
});

test("academicPeriod: resolvePeriodoId sin args devuelve periodo activo", async () => {
  const origGetActive = mockPrisma(prisma.anioLectivo, "findFirst", async () => ({ id: 5n }));
  const origFindPeriodo = mockPrisma(prisma.periodoAcademico, "findFirst", async () => ({ id: 10n }));
  const result = await resolvePeriodoId();
  assert.strictEqual(result, 10n);
  prisma.anioLectivo.findFirst = origGetActive;
  prisma.periodoAcademico.findFirst = origFindPeriodo;
});

test("academicPeriod: resolvePeriodoByParam con id numérico", async () => {
  const orig = mockPrisma(prisma.periodoAcademico, "findFirst", async () => ({ id: 11n }));
  const result = await resolvePeriodoByParam("11");
  assert.strictEqual(result, 11n);
  prisma.periodoAcademico.findFirst = orig;
});

test("academicPeriod: resolvePeriodoByParam con nombre", async () => {
  const orig = mockPrisma(prisma.periodoAcademico, "findFirst", async () => ({ id: 12n }));
  const result = await resolvePeriodoByParam("Primer bimestre");
  assert.strictEqual(result, 12n);
  prisma.periodoAcademico.findFirst = orig;
});

test("academicPeriod: resolvePeriodoByParam lanza 404 si no encontrado", async () => {
  const orig = mockPrisma(prisma.periodoAcademico, "findFirst", async () => null);
  let error;
  try { await resolvePeriodoByParam("inexistente"); } catch (e) { error = e; }
  assert.ok(error);
  assert.strictEqual(error.statusCode, 404);
  prisma.periodoAcademico.findFirst = orig;
});
