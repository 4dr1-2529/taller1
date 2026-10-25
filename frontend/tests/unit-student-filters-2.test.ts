import test from "node:test";
import assert from "node:assert/strict";
import {
  filterStudents,
  filterCourses,
  matchSearch,
} from "../src/lib/student-filters.js";

const makeStudent = (overrides: Record<string, unknown> = {}): any => ({
  id: "1",
  seccionId: "s1",
  nombres: "Juan",
  apellidos: "Pérez",
  codigo: "E001",
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

const makeCourse = (overrides: Record<string, unknown> = {}): any => ({
  id: "c1",
  codigo: "MAT101",
  nombre: "Matemáticas",
  profesorId: "p1",
  seccionId: "s1",
  anioLectivoId: "y1",
  cursoId: "cat1",
  activo: true,
  ...overrides,
});

test("filterStudents filtra por estado retirado", () => {
  const s1 = makeStudent({ id: "1", estado: "activo" });
  const s2 = makeStudent({ id: "2", estado: "retirado" });
  const filters = { seccionId: "", gradoId: "", courseId: "", profesorId: "", bimestre: "", estado: "activo", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [];
  const result = filterStudents([s1, s2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].estado, "activo");
});

test("filterStudents filtra por búsqueda de apellido", () => {
  const s1 = makeStudent({ id: "1", nombres: "Juan", apellidos: "Pérez", codigo: "E001" });
  const s2 = makeStudent({ id: "2", nombres: "Maria", apellidos: "López", codigo: "E002" });
  const filters = { seccionId: "", gradoId: "", courseId: "", profesorId: "", bimestre: "", estado: "", search: "López", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [];
  const result = filterStudents([s1, s2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].apellidos, "López");
});

test("filterCourses filtra por profesorId", () => {
  const c1 = makeCourse({ id: "c1", profesorId: "p1" });
  const c2 = makeCourse({ id: "c2", profesorId: "p2" });
  const filters = { profesorId: "p1", seccionId: "", gradoId: "", courseId: "", bimestre: "", estado: "", search: "", fecha: "", semana: "", riskLevel: "", alertStatus: "" };
  const secciones = [];
  const result = filterCourses([c1, c2], filters, secciones);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "c1");
});
