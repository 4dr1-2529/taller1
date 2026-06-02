"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import { attachPredictions, failCountByCourse, lowLmsStudents } from "@/lib/aggregates";
import {
  exportCourseRiskPdf,
  exportFailsByCoursePdf,
  exportLowLmsExcel,
  exportStudentsToExcel,
} from "@/lib/export-reports";
import type { Course, Enrollment, Student } from "@/types/academic";

type ReportsViewProps = {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
};

export function ReportsView({ students, courses, enrollments }: ReportsViewProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const withPred = useMemo(() => attachPredictions(students), [students]);
  const fails = useMemo(() => failCountByCourse(courses, enrollments, 11), [courses, enrollments]);
  const lowLms = useMemo(() => lowLmsStudents(students, 45), [students]);

  const courseRiskRows = useMemo(() => {
    const map = new Map(withPred.map((s) => [s.id, s]));
    return courses.map((c) => {
      const scores = enrollments
        .filter((e) => e.courseId === c.id)
        .map((e) => map.get(e.studentId))
        .filter(Boolean)
        .map((s) => s!.prediction.score);
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return { nombre: c.nombre, riesgoPromedio: Math.round(avg * 10) / 10, estudiantes: scores.length };
    });
  }, [courses, enrollments, withPred]);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--card)] shadow-[var(--card-shadow)]"
    >
      <div className="border-b border-[var(--border-subtle)] bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20">
            <Download className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Exportar reportes</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Descargue Excel o PDF para comités académicos. Los detalles por curso están en el panel principal y en Alertas.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 p-5 md:p-6">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            run("excel", () => exportStudentsToExcel(withPred, "estudiantes_riesgo.xlsx"))
          }
          className="btn-primary disabled:opacity-60"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden />
          {busy === "excel" ? "Generando…" : "Excel · Estudiantes y riesgo"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            run("pdf-cursos", () =>
              exportCourseRiskPdf(courseRiskRows, "Riesgo promedio por curso", "riesgo_por_curso.pdf"),
            )
          }
          className="btn-secondary disabled:opacity-60"
        >
          <FileText className="h-4 w-4" aria-hidden />
          {busy === "pdf-cursos" ? "Generando…" : "PDF · Riesgo por curso"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            run("pdf-fallas", () => exportFailsByCoursePdf(fails, "desaprobados_por_curso.pdf"))
          }
          className="btn-primary bg-gradient-to-r from-rose-600 to-pink-600 disabled:opacity-60"
        >
          <FileText className="h-4 w-4" aria-hidden />
          {busy === "pdf-fallas" ? "Generando…" : "PDF · Desaprobados"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("excel-lms", () => exportLowLmsExcel(lowLms, "baja_actividad_lms.xlsx"))}
          className="btn-secondary disabled:opacity-60"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden />
          {busy === "excel-lms" ? "Generando…" : "Excel · Baja actividad LMS"}
        </button>
      </div>
    </motion.section>
  );
}
