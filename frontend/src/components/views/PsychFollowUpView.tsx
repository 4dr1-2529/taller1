"use client";

import { useCallback, useEffect, useState } from "react";
import { HeartHandshake, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { api, type ApiPsychFollowUp } from "@/services/api";
import type { Student } from "@/types/academic";

type PsychFollowUpViewProps = {
  students: Student[];
  useApi?: boolean;
};

export function PsychFollowUpView({ students, useApi = false }: PsychFollowUpViewProps) {
  const { isAuthenticated, user } = useAuth();
  const [records, setRecords] = useState<ApiPsychFollowUp[]>([]);
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [resumen, setResumen] = useState("");
  const [acciones, setAcciones] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!useApi || !isAuthenticated) return;
    try {
      const res = await api.getPsychFollowUps();
      setRecords(res.items);
    } catch {
      setRecords([]);
    }
  }, [useApi, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || resumen.trim().length < 10) {
      toast.error("Complete el resumen (mínimo 10 caracteres)");
      return;
    }
    if (!useApi || !isAuthenticated) {
      toast.message("Modo local: el seguimiento se guarda al conectar la API");
      return;
    }
    setLoading(true);
    try {
      await api.createPsychFollowUp({
        studentId,
        resumen: resumen.trim(),
        acciones: acciones.trim() || undefined,
        profesional: `${user?.nombres} ${user?.apellidos}`,
      });
      toast.success("Seguimiento registrado");
      setResumen("");
      setAcciones("");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="premium-card rounded-2xl md:p-6 rounded-2xl p-8 text-center">
        <HeartHandshake className="mx-auto mb-3 h-10 w-10 text-rose-500" />
        <p className="text-sm text-slate-600">Seguimiento psicológico requiere sesión activa.</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-indigo-600">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="premium-card rounded-2xl md:p-6 rounded-2xl p-5">
        <h3 className="flex items-center gap-2 font-semibold">
          <HeartHandshake className="h-5 w-5 text-rose-500" />
          Nuevo seguimiento psicológico
        </h3>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/50"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombres} {s.apellidos} ({s.codigo})
              </option>
            ))}
          </select>
          <textarea
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            placeholder="Resumen de la sesión o entrevista…"
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/50"
          />
          <textarea
            value={acciones}
            onChange={(e) => setAcciones(e.target.value)}
            placeholder="Acciones acordadas (opcional)"
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/50"
          />
          <button
            type="submit"
            disabled={loading || !useApi}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Registrar seguimiento
          </button>
          {!useApi ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Conecte la API (inicio de sesión + servidor) para persistir en base de datos.
            </p>
          ) : null}
        </form>
      </section>

      <section className="premium-card rounded-2xl md:p-6 rounded-2xl p-5">
        <h3 className="font-semibold">Historial de seguimiento</h3>
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {records.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-500">Sin registros aún.</li>
          ) : (
            records.map((r) => (
              <li key={r.id} className="py-4">
                <p className="font-medium">
                  {r.student.nombres} {r.student.apellidos}{" "}
                  <span className="text-slate-500">· {r.student.codigo}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(r.fecha).toLocaleDateString("es-PE")} · {r.profesional ?? "—"}
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{r.resumen}</p>
                {r.acciones ? (
                  <p className="mt-1 text-sm text-slate-600">
                    <strong>Acciones:</strong> {r.acciones}
                  </p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
