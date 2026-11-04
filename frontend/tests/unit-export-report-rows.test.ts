import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStudentExcelRows,
  buildLowLmsExcelRows,
  buildCourseRiskPdfRows,
  buildFailsByCoursePdfRows,
} from "../src/lib/export-reports.js";

test("report row builders preserve real values and safe no-prediction fallbacks", () => {
  const student = {
    codigo: "E001", nombres: "Ana", apellidos: "Paz", nivel: "Primaria", estado: "activo",
    storedPrediction: { level: "alto", score: 82 },
    metrics: { promedioGeneral: 15, asistenciaGeneral: 91, lms: {
      engagement: "medio", horasPlataformaSemana: 2.5, actividadesRealizadas: 4,
      recursosConsultados: 8, actividadSemanalPct: [80, 60],
    } },
  } as any;
  const rows = buildStudentExcelRows([student, { ...student, storedPrediction: undefined, metrics: { ...student.metrics, lms: { ...student.metrics.lms, actividadSemanalPct: [] } } }]);
  assert.equal(rows[0].Estudiante, "Ana Paz");
  assert.equal(rows[0].Riesgo, "alto");
  assert.equal(rows[0].LMS_promedio_semanal, 70);
  assert.equal(rows[1].Riesgo, "Sin predicción");
  assert.equal(rows[1].Score, "—");
  assert.equal(rows[1].LMS_promedio_semanal, 0);

  const lms = buildLowLmsExcelRows([student, { ...student, storedPrediction: undefined }]);
  assert.equal(lms[0].Riesgo, "alto");
  assert.equal(lms[0].Compromiso_LMS, "medio");
  assert.equal(lms[1].Riesgo, "Sin predicción");

  assert.deepEqual(buildCourseRiskPdfRows([
    { nombre: "Matemática", riesgoPromedio: 75, estudiantes: 12 },
    { nombre: "Historia", riesgoPromedio: null, estudiantes: 8 },
  ]), [["Matemática", "75", "12"], ["Historia", "Sin predicción", "8"]]);
  assert.deepEqual(buildFailsByCoursePdfRows([{ nombre: "Ciencias", desaprobados: 3 }]), [["Ciencias", "3"]]);
});
