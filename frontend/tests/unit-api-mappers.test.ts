import test from "node:test";
import assert from "node:assert/strict";
import {
  formatSeccionLabel,
  mapStudentFromApi,
  mapTeacherFromApi,
  mapCourseFromApi,
  mapEnrollmentFromApi,
} from "../src/lib/api-mappers.js";

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

test("mappers cubren relaciones ausentes, fallback legado y números no finitos", () => {
  assert.equal(formatSeccionLabel(null), "Sin sección");
  assert.equal(formatSeccionLabel(null, "Nivel legado"), "Nivel legado");
  assert.equal(formatSeccionLabel({ id: "s1", nombre: "A", grado: { numero: 2, nombre: "Segundo", nivel: { codigo: "primaria", nombre: "Primaria" } } }), "Primaria · Segundo A");
  assert.equal(formatSeccionLabel({ id: "s1", nombre: "B", grado: { numero: 3 } }), "3° B");

  const noIndicators = mapStudentFromApi({
    id: "s2", codigo: "E002", nombres: "Eva", apellidos: "Paz", correo: null, telefono: null,
    estado: "retirado", promedioGeneral: Number.NaN, asistenciaGeneral: "n/a", nivel: "Secundaria",
  } as any);
  assert.equal(noIndicators.dni, "");
  assert.equal(noIndicators.estado, "retirado");
  assert.equal(noIndicators.metrics.promedioGeneral, 0);
  assert.equal(noIndicators.metrics.lms.engagement, "bajo");
  assert.equal(noIndicators.storedPrediction, undefined);

  const prediction = mapStudentFromApi({
    id: "s3", codigo: "E003", nombres: "Sol", apellidos: "Mar", correo: "", telefono: "",
    estado: "activo", promedioGeneral: "12", asistenciaGeneral: 80, seccionId: "s1",
    indicators: { dias_activos: 18, actividades_realizadas: 3, recursos_consultados: 4, tiempo_interaccion_lms: 8, promedio_general: 12, asistencia_general: 80 },
    predictions: [{ score: 77, nivelRiesgo: "alto", probabilidad: 0.77, factorsJson: "[]" }],
  } as any);
  assert.equal(prediction.nivel, "Sin sección");
  assert.equal(prediction.seccionId, "s1");
  assert.equal(prediction.metrics.lms.engagement, "alto");
  assert.equal(prediction.storedPrediction?.level, "alto");
  assert.equal(prediction.storedPrediction?.probability, 0.77);

  const teacher = mapTeacherFromApi({
    id: "t2", codigo: "T002", nombres: "Leo", apellidos: "Sol", especialidad: "Ciencias",
    correo: "leo@example.test", telefono: null, user: { id: "u2", email: "leo@example.test", activo: true },
    courses: [{ id: "c1", codigo: "MAT", nombre: "Matemática", seccionId: null, cursoCatalogo: null }],
  } as any);
  assert.equal(teacher.userId, "u2");
  assert.equal(teacher.telefono, "");
  assert.equal(teacher.courseCount, 1);
  assert.equal(teacher.courses[0].seccionId, undefined);

  assert.equal(mapCourseFromApi({ id: "c2", codigo: "HIS", nombre: "Historia", profesorId: "t1", nivel: "Primaria" } as any).nivel, "Primaria");
  assert.equal(mapCourseFromApi({ id: "c3", codigo: "BIO", nombre: "Biología", profesorId: "t1" } as any).nivel, "Sin sección");
  assert.equal(mapEnrollmentFromApi({ id: "m2", studentId: "s1", courseId: "c1", promedio: "bad", asistenciaPct: null } as any).promedio, 0);
});
