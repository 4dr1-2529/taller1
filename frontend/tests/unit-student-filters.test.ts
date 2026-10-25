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

const makeStudent = (overrides: Record<string, unknown> = {}): any => ({
  id: "1",
  codigo: "E001",
  nombres: "Juan",
  apellidos: "Pérez",
  seccionId: "1",
  estado: "activo",
  promedioGeneral: 15,
  asistenciaGeneral: 90,
  activo: true,
  fechaIngreso: "2026-01-01",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  usuarioId: null,
  seccion: null,
  apoderados: [],
  matriculas: [],
  inscripciones: [],
  calificaciones: [],
  historialesAcademicos: [],
  asistencias: [],
  resumenesAsistencia: [],
  lmsActividades: [],
  lmsEntregasTarea: [],
  lmsIndicadores: [],
  predicciones: [],
  recomendaciones: [],
  alertas: [],
  auditorias: [],
  metrics: { promedioGeneral: 15, asistenciaGeneral: 90 },
  storedPrediction: null,
  ...overrides,
});

test("parseGradoNumero extrae número de grado", () => {
  assert.strictEqual(parseGradoNumero("1ro A"), 1);
  assert.strictEqual(parseGradoNumero("2do B"), 2);
  assert.strictEqual(parseGradoNumero("6to C"), 6);
});

test("parseGradoNumero devuelve null si no hay número", () => {
  assert.strictEqual(parseGradoNumero("Primero"), null);
  assert.strictEqual(parseGradoNumero(""), null);
});

test("parseSeccionLetra extrae letra de sección", () => {
  assert.strictEqual(parseSeccionLetra("1ro A"), "A");
  assert.strictEqual(parseSeccionLetra("2do B"), "B");
  assert.strictEqual(parseSeccionLetra("6to C"), "C");
});

test("parseSeccionLetra devuelve vacío si no hay letra", () => {
  assert.strictEqual(parseSeccionLetra("1ro"), "");
  assert.strictEqual(parseSeccionLetra(""), "");
});

test("salónLabel combina grado y letra", () => {
  assert.strictEqual(salónLabel(1, "A"), "1A");
  assert.strictEqual(salónLabel(2, "B"), "2B");
});

test("salónLabel devuelve guion si no hay datos", () => {
  assert.strictEqual(salónLabel(null, "A"), "—");
  assert.strictEqual(salónLabel(1, ""), "—");
  assert.strictEqual(salónLabel(null, ""), "—");
});

test("matchSearch devuelve true sin query", () => {
  const student = { nombres: "Juan", apellidos: "Pérez", codigo: "E001" };
  assert.strictEqual(matchSearch(student, ""), true);
  assert.strictEqual(matchSearch(student, "   "), true);
});

test("matchSearch busca en nombres", () => {
  const student = { nombres: "Juan Pérez", apellidos: "García", codigo: "E001" };
  assert.strictEqual(matchSearch(student, "Juan"), true);
  assert.strictEqual(matchSearch(student, "Pérez"), true);
});

test("matchSearch busca en código", () => {
  const student = { nombres: "Juan", apellidos: "Pérez", codigo: "E001" };
  assert.strictEqual(matchSearch(student, "E001"), true);
});

test("matchSearch no encuentra", () => {
  const student = { nombres: "Juan", apellidos: "Pérez", codigo: "E001" };
  assert.strictEqual(matchSearch(student, "Maria"), false);
});

test("filterStudents filtra por seccionId", () => {
  const s1 = makeStudent({ id: "1", seccionId: "s1", nombres: "A", apellidos: "B", codigo: "C", estado: "activo", promedioGeneral: 10, asistenciaGeneral: 90, usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } });
  const s2 = makeStudent({ id: "2", seccionId: "s2", nombres: "C", apellidos: "D", codigo: "E", estado: "activo", promedioGeneral: 10, asistenciaGeneral: 90, usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } });
  const filters = { seccionId: "s1", gradoId: "", courseId: "", profesorId: "", bimestre: "", estado: "", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [];
  const result = filterStudents([s1, s2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "1");
});

test("filterStudents filtra por gradoId", () => {
  const s1 = makeStudent({ id: "1", seccionId: "s1", nombres: "A", apellidos: "B", codigo: "C", estado: "activo", promedioGeneral: 10, asistenciaGeneral: 90, usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } });
  const s2 = makeStudent({ id: "2", seccionId: "s2", nombres: "C", apellidos: "D", codigo: "E", estado: "activo", promedioGeneral: 10, asistenciaGeneral: 90, usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } });
  const filters = { seccionId: "", gradoId: "1", courseId: "", profesorId: "", bimestre: "", estado: "", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [{ id: "s1", gradoId: 1, nombre: "A", capacidad: 30 }, { id: "s2", gradoId: 2, nombre: "B", capacidad: 30 }];
  const result = filterStudents([s1, s2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "1");
});

test("filterStudents filtra por estado", () => {
  const s1 = makeStudent({ id: "1", seccionId: "s1", nombres: "A", apellidos: "B", codigo: "C", estado: "activo", promedioGeneral: 10, asistenciaGeneral: 90, usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } });
  const s2 = makeStudent({ id: "2", seccionId: "s1", nombres: "C", apellidos: "D", codigo: "E", estado: "retirado", promedioGeneral: 10, asistenciaGeneral: 90, usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } });
  const filters = { seccionId: "", gradoId: "", courseId: "", profesorId: "", bimestre: "", estado: "activo", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [{ id: "s1", gradoId: "1", nombre: "A", capacidad: 30 }];
  const result = filterStudents([s1, s2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].estado, "activo");
});

test("filterStudents filtra por búsqueda", () => {
  const s1 = makeStudent({ id: "1", seccionId: "s1", nombres: "Juan Pérez", apellidos: "García", codigo: "E001", estado: "activo", promedioGeneral: 10, asistenciaGeneral: 90, usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } });
  const s2 = makeStudent({ id: "2", seccionId: "s1", nombres: "María", apellidos: "López", codigo: "E002", estado: "activo", promedioGeneral: 10, asistenciaGeneral: 90, usuarioId: null, seccion: null, apoderados: [], matriculas: [], inscripciones: [], calificaciones: [], historialesAcademicos: [], asistencias: [], resumenesAsistencia: [], lmsActividades: [], lmsEntregasTarea: [], lmsIndicadores: [], predicciones: [], recomendaciones: [], alertas: [], auditorias: [], metrics: { promedioGeneral: 10, asistenciaGeneral: 90 } });
  const filters = { seccionId: "", gradoId: "", courseId: "", profesorId: "", bimestre: "", estado: "", search: "Juan", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [];
  const result = filterStudents([s1, s2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "1");
});

test("filterCourses filtra por profesorId", () => {
  const c1 = { id: "c1", profesorId: "p1", codigo: "C1", nombre: "Curso 1", estado: "activo", createdAt: "2026-01-01", updatedAt: "2026-01-01" };
  const c2 = { id: "c2", profesorId: "p2", codigo: "C2", nombre: "Curso 2", estado: "activo", createdAt: "2026-01-01", updatedAt: "2026-01-01" };
  const filters = { profesorId: "p1", seccionId: "", gradoId: "", courseId: "", bimestre: "", estado: "", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [];
  const result = filterCourses([c1, c2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "c1");
});
