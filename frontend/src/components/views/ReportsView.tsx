"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import { attachPredictions, failCountByCourse, lowLmsStudents, riskByCourse } from "@/lib/aggregates";
import {
  exportCourseRiskPdf,
  exportFailsByCoursePdf,
  exportLowLmsExcel,
  exportStudentsToExcel,
} from "@/lib/export-reports";
import type { Course, Student } from "@/types/academic";

type ReportsViewProps = {
  students: Student[];
  courses: Course[];
};

export function ReportsView({ students, courses }: ReportsViewProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const withPred = useMemo(() => attachPredictions(students), [students]);
  const fails = useMemo(() => failCountByCourse(students, courses, 11), [students, courses]);
  const lowLms = useMemo(() => lowLmsStudents(students, 45), [students]);
  const courseRiskRows = useMemo(() => riskByCourse(students, courses), [students, courses]);

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
      <div className="border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--brand-orange)]/10 via-transparent to-[var(--brand-navy)]/10 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-navy)] text-white shadow-lg">
            <Download className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reportes académicos</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Exportación basada en matrícula por salón y oferta de cursos (sin inscripción curso×alumno).
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
        <button
          type="button"
          disabled={busy !== null}
          className="btn-secondary flex items-center gap-2"
          onClick={() => void run("estudiantes", () => exportStudentsToExcel(withPred))}
        >
          <FileSpreadsheet className="h-4 w-4" />
          {busy === "estudiantes" ? "Generando…" : "Excel — estudiantes y riesgo"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          className="btn-secondary flex items-center gap-2"
          onClick={() =>
            void run("riesgo", () =>
              exportCourseRiskPdf(courseRiskRows, "Riesgo por curso (salón matriculado)"),
            )
          }
        >
          <FileText className="h-4 w-4" />
          {busy === "riesgo" ? "Generando…" : "PDF — riesgo por curso (salón)"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          className="btn-secondary flex items-center gap-2"
          onClick={() => void run("fails", () => exportFailsByCoursePdf(fails))}
        >
          <FileText className="h-4 w-4" />
          {busy === "fails" ? "Generando…" : "PDF — desaprobados por curso"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          className="btn-secondary flex items-center gap-2"
          onClick={() => void run("lms", () => exportLowLmsExcel(lowLms))}
        >
          <FileSpreadsheet className="h-4 w-4" />
          {busy === "lms" ? "Generando…" : "Excel — baja actividad LMS"}
        </button>
      </div>
    </motion.section>
  );
}
