"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Exportación</h3>
        <p className="text-sm text-slate-600">
          Genera archivos listos para comité académico o anexos de tesis (Excel / PDF).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              run("excel", () => exportStudentsToExcel(withPred, "estudiantes_riesgo.xlsx"))
            }
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
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
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
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
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
          >
            <FileText className="h-4 w-4" aria-hidden />
            {busy === "pdf-fallas" ? "Generando…" : "PDF · Desaprobados"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run("excel-lms", () => exportLowLmsExcel(lowLms, "baja_actividad_lms.xlsx"))}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden />
            {busy === "excel-lms" ? "Generando…" : "Excel · Baja actividad LMS"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Estudiantes en riesgo por curso</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {atRiskByCourse.map((row) => (
              <li key={row.courseId} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="font-semibold text-slate-900">{row.courseName}</p>
                {row.students.length === 0 ? (
                  <p className="text-slate-500">Sin estudiantes sobre umbral.</p>
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-700">
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
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Cursos con más desaprobados</h3>
          <p className="text-sm text-slate-600">Umbral: promedio de matrícula &lt; 11.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2">Curso</th>
                  <th className="py-2">Desaprobados</th>
                </tr>
              </thead>
              <tbody>
                {[...fails]
                  .sort((a, b) => b.desaprobados - a.desaprobados)
                  .map((f) => (
                    <tr key={f.courseId} className="border-b border-slate-100">
                      <td className="py-2">{f.nombre}</td>
                      <td className="py-2 font-semibold">{f.desaprobados}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Estudiantes con baja actividad LMS</h3>
        <p className="text-sm text-slate-600">Participación promedio semanal ≤ 45%.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2">Estudiante</th>
                <th className="py-2">Engagement</th>
                <th className="py-2">Horas semana</th>
                <th className="py-2">Score riesgo</th>
              </tr>
            </thead>
            <tbody>
              {lowLms.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="py-2">
                    {s.nombres} {s.apellidos}
                  </td>
                  <td className="py-2 capitalize">{s.metrics.lms.engagement}</td>
                  <td className="py-2">{s.metrics.lms.horasPlataformaSemana.toFixed(1)} h</td>
                  <td className="py-2 font-medium">{Math.round(s.prediction.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
