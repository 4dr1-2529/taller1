import test from "node:test";
import assert from "node:assert/strict";
import {
  parseGradoNumero,
  parseSeccionLetra,
  salónLabel,
  matchSearch,
  filterStudents,
  filterCourses,
} from "../src/lib/student-filters.js";

test("parseGradoNumero con texto sin número devuelve null", () => {
  assert.strictEqual(parseGradoNumero("Primero"), null);
  assert.strictEqual(parseGradoNumero(""), null);
});

test("parseSeccionLetra con texto sin letra devuelve vacío", () => {
  assert.strictEqual(parseSeccionLetra("1ro"), "");
  assert.strictEqual(parseSeccionLetra(""), "");
});

test("salónLabel con nivel null devuelve guion", () => {
  assert.strictEqual(salónLabel(null, "A"), "—");
});

test("salónLabel con letra vacía devuelve guion", () => {
  assert.strictEqual(salónLabel(1, ""), "—");
});

test("matchSearch con query vacío devuelve true", () => {
  const student = { nombres: "Juan", apellidos: "Pérez", codigo: "E001" };
  assert.strictEqual(matchSearch(student, ""), true);
  assert.strictEqual(matchSearch(student, "   "), true);
});

test("matchSearch busca en apellidos", () => {
  const student = { nombres: "Juan", apellidos: "Pérez", codigo: "E001" };
  assert.strictEqual(matchSearch(student, "Pérez"), true);
});

test("filterStudents con seccionId filtra correctamente", () => {
  const s1 = { id: "1", seccionId: "s1", nombres: "A", apellidos: "B", codigo: "C", estado: "activo", promedioGeneral: 10, asistenciaGeneral: 90, activo: true, fechaIngreso: "2026-01-01", createdAt: "2026-01-01", updatedAt: "2026-01-01", usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } };
  const s2 = { id: "2", seccionId: "s2", nombres: "D", apellidos: "E", codigo: "F", estado: "activo", promedioGeneral: 10, asistenciaGeneral: 90, activo: true, fechaIngreso: "2026-01-01", createdAt: "2026-01-01", updatedAt: "2026-01-01", usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } };
  const filters = { seccionId: "s1", gradoId: "", courseId: "", profesorId: "", bimestre: "", estado: "", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [];
  const result = filterStudents([s1, s2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "1");
});

test("filterStudents filtra por estado", () => {
  const s1 = { id: "1", seccionId: "s1", nombres: "A", apellidos: "B", codigo: "C", estado: "activo", promedioGeneral: 10, asistenciaGeneral: 90, activo: true, fechaIngreso: "2026-01-01", createdAt: "2026-01-01", updatedAt: "2026-01-01", usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } };
  const s2 = { id: "2", seccionId: "s1", nombres: "C", apellidos: "D", codigo: "E", estado: "retirado", promedioGeneral: 10, asistenciaGeneral: 90, activo: true, fechaIngreso: "2026-01-01", createdAt: "2026-01-01", updatedAt: "2026-01-01", usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } };
  const filters = { seccionId: "", gradoId: "", courseId: "", profesorId: "", bimestre: "", estado: "activo", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [{ id: "s1", gradoId: 1, nombre: "A", capacidad: 30 }];
  const result = filterStudents([s1, s2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].estado, "activo");
});

test("filterCourses filtra por profesorId", () => {
  const c1 = { id: "c1", profesorId: "p1", codigo: "C1", nombre: "Curso 1", activo: true, seccionId: "s1", cursoId: "cat1", anioLectivoId: "y1" };
  const c2 = { id: "c2", profesorId: "p2", codigo: "C2", nombre: "Curso 2", activo: true, seccionId: "s2", cursoId: "cat2", anioLectivoId: "y1" };
  const filters = { profesorId: "p1", seccionId: "", gradoId: "", courseId: "", bimestre: "", estado: "", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [];
  const result = filterCourses([c1, c2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "c1");
});
