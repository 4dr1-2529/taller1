import test from "node:test";
import assert from "node:assert/strict";
import {
  exportCourseRiskPdf,
  exportFailsByCoursePdf,
  exportLowLmsExcel,
  exportStudentsToExcel,
} from "../src/lib/export-reports.js";

function installDownloadEnvironment() {
  const downloads: string[] = [];
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalRevoke = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => ({
        download: "",
        href: "",
        click() {
          downloads.push(this.download);
        },
      }),
      body: {
        appendChild() {},
        removeChild() {},
      },
    },
  });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: undefined });
  return {
    downloads,
    restore() {
      if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
      else Reflect.deleteProperty(globalThis, "document");
      if (originalRevoke) Object.defineProperty(URL, "revokeObjectURL", originalRevoke);
      else Reflect.deleteProperty(URL, "revokeObjectURL");
    },
  };
}

function createPdfSaver(downloads: string[]) {
  return (document: { output: () => string }, filename: string) => {
    assert.match(document.output(), /^%PDF-/);
    downloads.push(filename);
  };
}

const student = {
  codigo: "EST-001",
  nombres: "Ana",
  apellidos: "Paz",
  nivel: "Primaria",
  estado: "activo",
  storedPrediction: { level: "medio", score: 52 },
  metrics: {
    promedioGeneral: 15,
    asistenciaGeneral: 92,
    lms: {
      engagement: "alta",
      horasPlataformaSemana: 3,
      actividadesRealizadas: 5,
      recursosConsultados: 8,
      actividadSemanalPct: [80, 90],
    },
  },
} as any;

test("report exporters trigger Excel and PDF downloads at custom paths", async () => {
  const environment = installDownloadEnvironment();
  try {
    await exportStudentsToExcel([student], "students.xlsx");
    await exportLowLmsExcel([student], "lms.xlsx");
    await exportCourseRiskPdf(
      [{ nombre: "Matemática", riesgoPromedio: 52, estudiantes: 20 }],
      "Riesgo por curso",
      "course-risk.pdf",
      createPdfSaver(environment.downloads),
    );
    await exportFailsByCoursePdf(
      [{ nombre: "Ciencias", desaprobados: 3 }],
      "fails.pdf",
      createPdfSaver(environment.downloads),
    );
    assert.deepEqual(environment.downloads, [
      "students.xlsx",
      "lms.xlsx",
      "course-risk.pdf",
      "fails.pdf",
    ]);
  } finally {
    environment.restore();
  }
});

test("report exporters use their documented default filenames", async () => {
  const environment = installDownloadEnvironment();
  try {
    await exportStudentsToExcel([student]);
    await exportLowLmsExcel([student]);
    await exportCourseRiskPdf([], "Riesgo por curso", undefined, createPdfSaver(environment.downloads));
    await exportFailsByCoursePdf([], undefined, createPdfSaver(environment.downloads));
    assert.deepEqual(environment.downloads, [
      "reporte_estudiantes_riesgo.xlsx",
      "reporte_baja_actividad_lms.xlsx",
      "reporte_cursos_riesgo.pdf",
      "reporte_desaprobados_por_curso.pdf",
    ]);
  } finally {
    environment.restore();
  }
});
