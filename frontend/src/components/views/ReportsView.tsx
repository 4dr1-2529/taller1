"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, FileText, Download, BarChart3 } from "lucide-react";
import {
  attachPredictions,
  atRiskStudentsByCourse,
  failCountByCourse,
  lowLmsStudents,
} from "@/lib/aggregates";
import {
  exportCourseRiskPdf,
  exportFailsByCoursePdf,
  exportLowLmsExcel,
  exportStudentsToExcel,
} from "@/lib/export-reports";
import type { Course, Enrollment, Student } from "@/types/academic";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { RiskBadge } from "@/components/ui/RiskBadge";

type ReportsViewProps = {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
};

export function ReportsView({ students, courses, enrollments }: ReportsViewProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const withPred = useMemo(() => attachPredictions(students), [students]);
  const atRiskByCourse = useMemo(
    () => atRiskStudentsByCourse(students, courses, enrollments, 41),
    [students, courses, enrollments],
  );
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

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-white/10">
              <Download className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Reports & Export
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Generate Excel and PDF reports for academic committees
          </p>
        </div>
      </motion.div>

      {/* Export Buttons */}
      <motion.section variants={cardVariants} initial="hidden" animate="visible" className="premium-card p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
            <FileSpreadsheet className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Exportación</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Genera archivos listos para comité académico o anexos de tesis (Excel / PDF).
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
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

      {/* Data Sections */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* At-Risk Students by Course */}
        <motion.article variants={cardVariants} initial="hidden" animate="visible" className="premium-card p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 ring-1 ring-white/10">
              <BarChart3 className="h-4 w-4 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Estudiantes en riesgo por curso</h3>
              <p className="text-xs text-[var(--text-secondary)]">Students above risk threshold per course</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {atRiskByCourse.map((row) => (
              <li key={row.courseId} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/30 p-3">
                <p className="font-semibold text-[var(--text-primary)]">{row.courseName}</p>
                {row.students.length === 0 ? (
                  <p className="text-[var(--text-muted)]">Sin estudiantes sobre umbral.</p>
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[var(--text-secondary)]">
                    {row.students.map((s) => (
                      <li key={s.id}>
                        {s.nombre} — score {s.score} ({s.level})
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </motion.article>

        {/* Failed Courses */}
        <motion.article variants={cardVariants} initial="hidden" animate="visible" className="premium-card p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-white/10">
              <FileText className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Cursos con más desaprobados</h3>
              <p className="text-xs text-[var(--text-secondary)]">Umbral: promedio de matrícula &lt; 11.</p>
            </div>
          </div>
          <DataTablePanel
            title="Desaprobados por curso"
            isEmpty={fails.length === 0}
            emptyMessage="No hay cursos con desaprobados."
          >
            <TableWrap>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Desaprobados</th>
                </tr>
              </thead>
              <tbody>
                {[...fails]
                  .sort((a, b) => b.desaprobados - a.desaprobados)
                  .map((f) => (
                    <tr key={f.courseId}>
                      <td>{f.nombre}</td>
                      <td className="font-semibold">{f.desaprobados}</td>
                    </tr>
                  ))}
              </tbody>
            </TableWrap>
          </DataTablePanel>
        </motion.article>
      </div>

      {/* Low LMS Activity */}
      <motion.article variants={cardVariants} initial="hidden" animate="visible" className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-1 ring-white/10">
            <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Estudiantes con baja actividad LMS</h3>
            <p className="text-xs text-[var(--text-secondary)]">Participación promedio semanal ≤ 45%.</p>
          </div>
        </div>
        <DataTablePanel
          title="Baja actividad LMS"
          isEmpty={lowLms.length === 0}
          emptyMessage="No hay estudiantes con baja actividad LMS."
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Engagement</th>
                <th>Horas semana</th>
                <th>Score riesgo</th>
              </tr>
            </thead>
            <tbody>
              {lowLms.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.nombres} {s.apellidos}
                  </td>
                  <td className="capitalize">{s.metrics.lms.engagement}</td>
                  <td>{s.metrics.lms.horasPlataformaSemana.toFixed(1)} h</td>
                  <td className="font-medium">{Math.round(s.prediction.score)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </DataTablePanel>
      </motion.article>
    </div>
  );
}
