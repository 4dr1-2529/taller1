import test from "node:test";
import assert from "node:assert/strict";
import { mapStudentFromApi, mapTeacherFromApi, mapCourseFromApi, mapEnrollmentFromApi } from "../src/lib/api-mappers.js";

test("mapStudentFromApi mapea campos básicos", () => {
  const row = {
    id: "1",
    codigo: "E001",
    nombres: "Juan",
    apellidos: "Pérez",
    correo: "juan@test.com",
    telefono: "123456789",
    estado: "activo",
    promedioGeneral: "15.5",
    asistenciaGeneral: "90",
    seccion: null,
    nivel: "Primaria",
    indicators: { promedio_general: 15, asistencia_general: 90 },
    predictions: [],
    enrolledCourseIds: [],
  };
  const s = mapStudentFromApi(row);
  assert.strictEqual(s.id, "1");
  assert.strictEqual(s.codigo, "E001");
  assert.strictEqual(s.nombres, "Juan");
  assert.strictEqual(s.apellidos, "Pérez");
  assert.strictEqual(s.correo, "juan@test.com");
  assert.strictEqual(s.telefono, "123456789");
  assert.strictEqual(s.estado, "activo");
});

test("mapStudentFromApi mapea métricas", () => {
  const row = {
    id: "1",
    codigo: "E001",
    nombres: "Juan",
    apellidos: "Pérez",
    correo: "juan@test.com",
    telefono: null,
    estado: "activo",
    promedioGeneral: null,
    asistenciaGeneral: null,
    seccion: null,
    nivel: null,
    indicators: { promedio_general: null, asistencia_general: null },
    predictions: [],
    enrolledCourseIds: [],
  };
  const s = mapStudentFromApi(row);
  assert.strictEqual(s.metrics.promedioGeneral, 0);
  assert.strictEqual(s.metrics.asistenciaGeneral, 0);
});

test("mapTeacherFromApi mapea docente", () => {
  const row = {
    id: "t1",
    codigo: "T001",
    nombres: "Ana",
    apellidos: "Gómez",
    especialidad: "Matemáticas",
    correo: "ana@test.com",
    telefono: "987654321",
    userId: null,
    user: null,
    courses: [],
    _count: { courses: 0 },
  };
  const t = mapTeacherFromApi(row);
  assert.strictEqual(t.id, "t1");
  assert.strictEqual(t.codigo, "T001");
  assert.strictEqual(t.nombres, "Ana");
  assert.strictEqual(t.apellidos, "Gómez");
  assert.strictEqual(t.especialidad, "Matemáticas");
  assert.strictEqual(t.correo, "ana@test.com");
  assert.strictEqual(t.telefono, "987654321");
});

test("mapCourseFromApi mapea curso", () => {
  const row = {
    id: "c1",
    codigo: "MAT101",
    nombre: "Matemáticas",
    profesorId: "t1",
    seccionId: null,
    cursoCatalogo: { nombre: "Álgebra", area: "Ciencias" },
    periodo: "2026",
  };
  const c = mapCourseFromApi(row);
  assert.strictEqual(c.id, "c1");
  assert.strictEqual(c.codigo, "MAT101");
  assert.strictEqual(c.nombre, "Matemáticas");
  assert.strictEqual(c.profesorId, "t1");
  assert.strictEqual(c.nivel, "Ciencias · Álgebra");
});

test("mapEnrollmentFromApi mapea matrícula", () => {
  const row = {
    id: "e1",
    studentId: "s1",
    courseId: "c1",
    promedio: "15.5",
    asistenciaPct: "90.5",
    periodo: "2026",
  };
  const e = mapEnrollmentFromApi(row);
  assert.strictEqual(e.id, "e1");
  assert.strictEqual(e.studentId, "s1");
  assert.strictEqual(e.courseId, "c1");
  assert.strictEqual(e.promedio, 15.5);
  assert.strictEqual(e.asistenciaPct, 90.5);
  assert.strictEqual(e.periodo, "2026");
});
