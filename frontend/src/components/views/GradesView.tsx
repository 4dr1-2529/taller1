"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import type { Course, Student } from "@/types/academic";
import { EmptyState } from "@/components/EmptyState";

type GradeRow = {
  id: string;
  studentId: string;
  courseId: string;
  periodo: string;
  bimestre: number;
  nota: number;
  observacion?: string | null;
  student?: { codigo: string; nombres: string; apellidos: string };
  course?: { codigo: string; nombre: string };
};

type GradesViewProps = {
  students: Student[];
  courses: Course[];
};

export function GradesView({ students, courses }: GradesViewProps) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    periodo: "2026-I",
    bimestre: "1",
    nota: "",
    observacion: "",
  });

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const res = await api.getGrades();
      setItems(res.items as GradeRow[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Registro de notas"
        description="Inicie sesión para registrar calificaciones por bimestre (escala 0–20, Perú)."
        showLogin
      />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nota = Number.parseFloat(form.nota.replace(",", "."));
    if (!form.studentId || !form.courseId || !Number.isFinite(nota)) {
      toast.error("Complete estudiante, curso y nota válida (0–20)");
      return;
    }
    try {
      await api.createGrade({
        studentId: form.studentId,
        courseId: form.courseId,
        periodo: form.periodo,
        bimestre: Number(form.bimestre),
        nota,
        observacion: form.observacion || undefined,
      });
      toast.success("Nota registrada — promedio del estudiante actualizado");
      setForm((p) => ({ ...p, nota: "", observacion: "" }));
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar nota");
    }
  }

  return (
    <div className="space-y-6">
      <article className="glass-card p-5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Registrar nota</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Escala vigente en Perú: 0 a 20 por bimestre. El promedio general del estudiante se recalcula automáticamente.
        </p>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={(e) => void handleSubmit(e)}>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 md:col-span-2"
            value={form.studentId}
            onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
            required
          >
            <option value="">Estudiante</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.codigo} — {s.nombres} {s.apellidos}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 md:col-span-2"
            value={form.courseId}
            onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
            required
          >
            <option value="">Curso</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Periodo"
            value={form.periodo}
            onChange={(e) => setForm((p) => ({ ...p, periodo: e.target.value }))}
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={form.bimestre}
            onChange={(e) => setForm((p) => ({ ...p, bimestre: e.target.value }))}
          >
            {[1, 2, 3, 4].map((b) => (
              <option key={b} value={b}>
                Bimestre {b}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Nota (0–20)"
            inputMode="decimal"
            value={form.nota}
            onChange={(e) => setForm((p) => ({ ...p, nota: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 md:col-span-2"
            placeholder="Observación (opcional)"
            value={form.observacion}
            onChange={(e) => setForm((p) => ({ ...p, observacion: e.target.value }))}
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 md:col-span-3"
          >
            Guardar nota
          </button>
        </form>
      </article>

      <article className="glass-card p-5">
        <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Historial de notas</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">Sin notas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                <tr>
                  <th className="py-2">Estudiante</th>
                  <th className="py-2">Curso</th>
                  <th className="py-2">Periodo</th>
                  <th className="py-2">Bim.</th>
                  <th className="py-2">Nota</th>
                </tr>
              </thead>
              <tbody>
                {items.map((g) => (
                  <tr key={g.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2">
                      {g.student
                        ? `${g.student.nombres} ${g.student.apellidos}`
                        : g.studentId.slice(0, 8)}
                    </td>
                    <td className="py-2">{g.course?.nombre ?? "—"}</td>
                    <td className="py-2">{g.periodo}</td>
                    <td className="py-2">{g.bimestre}</td>
                    <td className="py-2 font-semibold">{g.nota.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
