"use client";

import type { StudentWithPrediction } from "@/lib/aggregates";

export async function exportStudentsToExcel(
  rows: StudentWithPrediction[],
  filename = "reporte_estudiantes_riesgo.xlsx",
): Promise<void> {
  const XLSX = await import("xlsx");
  const data = rows.map((s) => ({
    Codigo: s.codigo,
    Estudiante: `${s.nombres} ${s.apellidos}`,
    Nivel: s.nivel,
    Estado: s.estado,
    Riesgo: s.prediction.level,
    Score: s.prediction.score,
    Promedio: s.metrics.promedioGeneral,
    Asistencia: s.metrics.asistenciaGeneral,
    LMS_promedio_semanal:
      s.metrics.lms.actividadSemanalPct.reduce((a, b) => a + b, 0) /
      (s.metrics.lms.actividadSemanalPct.length || 1),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
  XLSX.writeFile(wb, filename);
}

export async function exportCourseRiskPdf(
  rows: { nombre: string; riesgoPromedio: number; estudiantes: number }[],
  title: string,
  filename = "reporte_cursos_riesgo.pdf",
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [["Curso", "Riesgo promedio", "Matriculados"]],
    body: rows.map((r) => [
      r.nombre,
      String(r.riesgoPromedio),
      String(r.estudiantes),
    ]),
  });
  doc.save(filename);
}

export async function exportLowLmsExcel(
  students: StudentWithPrediction[],
  filename = "reporte_baja_actividad_lms.xlsx",
): Promise<void> {
  const XLSX = await import("xlsx");
  const data = students.map((s) => ({
    Codigo: s.codigo,
    Estudiante: `${s.nombres} ${s.apellidos}`,
    Engagement: s.metrics.lms.engagement,
    Horas_plataforma_sem: s.metrics.lms.horasPlataformaSemana,
    Tareas: `${s.metrics.lms.tareasEntregadas}/${s.metrics.lms.tareasTotales}`,
    Score_riesgo: s.prediction.score,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Baja_LMS");
  XLSX.writeFile(wb, filename);
}

export async function exportFailsByCoursePdf(
  rows: { nombre: string; desaprobados: number }[],
  filename = "reporte_desaprobados_por_curso.pdf",
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Cursos con más desaprobados (promedio < 11)", 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [["Curso", "Cantidad desaprobados"]],
    body: rows.map((r) => [r.nombre, String(r.desaprobados)]),
  });
  doc.save(filename);
}
