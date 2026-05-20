"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import type { Student } from "@/types/academic";
import { EmptyState } from "@/components/EmptyState";

type AttendanceRow = {
  id: string;
  studentId: string;
  fecha: string;
  presente: boolean;
  justificado: boolean;
  tardanza: boolean;
  observacion?: string | null;
  student?: { codigo: string; nombres: string; apellidos: string };
};

type AttendanceViewProps = {
  students: Student[];
};

export function AttendanceView({ students }: AttendanceViewProps) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    fecha: new Date().toISOString().slice(0, 10),
    presente: true,
    justificado: false,
    tardanza: false,
    observacion: "",
  });

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const res = await api.getAttendance();
      setItems(res.items as AttendanceRow[]);
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
        title="Control de asistencia"
        description="Registre asistencia diaria por estudiante. Los docentes y tutores pueden marcar presente, tardanza o falta justificada."
        showLogin
      />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentId || !form.fecha) {
      toast.error("Seleccione estudiante y fecha");
      return;
    }
    try {
      await api.createAttendance({
        studentId: form.studentId,
        fecha: form.fecha,
        presente: form.presente,
        justificado: form.justificado,
        tardanza: form.tardanza,
        observacion: form.observacion || undefined,
      });
      toast.success("Asistencia registrada");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar");
    }
  }

  return (
    <div className="space-y-6">
      <article className="glass-card p-5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Registrar asistencia</h3>
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
          <input
            type="date"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={form.fecha}
            onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
            required
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.presente}
              onChange={(e) => setForm((p) => ({ ...p, presente: e.target.checked }))}
            />
            Presente
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.tardanza}
              onChange={(e) => setForm((p) => ({ ...p, tardanza: e.target.checked }))}
            />
            Tardanza
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.justificado}
              onChange={(e) => setForm((p) => ({ ...p, justificado: e.target.checked }))}
            />
            Justificado
          </label>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 md:col-span-2"
            placeholder="Observación"
            value={form.observacion}
            onChange={(e) => setForm((p) => ({ ...p, observacion: e.target.value }))}
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Guardar
          </button>
        </form>
      </article>

      <article className="glass-card p-5">
        <h3 className="mb-3 font-semibold">Últimos registros</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">Sin registros de asistencia.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Estudiante</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="py-2">{new Date(a.fecha).toLocaleDateString("es-PE")}</td>
                    <td className="py-2">
                      {a.student ? `${a.student.nombres} ${a.student.apellidos}` : a.studentId}
                    </td>
                    <td className="py-2 capitalize">
                      {a.presente ? (a.tardanza ? "Tardanza" : "Presente") : a.justificado ? "Falta justificada" : "Falta"}
                    </td>
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
