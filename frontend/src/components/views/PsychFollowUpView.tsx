"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeartHandshake, Plus, UserCog } from "lucide-react";
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

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="premium-card rounded-2xl p-8 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 ring-1 ring-white/10">
            <HeartHandshake className="h-6 w-6 text-rose-400" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Seguimiento psicológico requiere sesión activa.</p>
          <Link href="/login" className="mt-2 text-sm font-semibold text-violet-400 hover:text-violet-300">
            Iniciar sesión
          </Link>
        </div>
      </motion.div>
    );
  }

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 ring-1 ring-white/10">
              <UserCog className="h-4 w-4 text-pink-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Psychological Follow-Up
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Track counseling sessions and intervention plans
          </p>
        </div>
      </motion.div>

      {/* New Follow-Up Form */}
      <motion.section variants={cardVariants} initial="hidden" animate="visible" className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 ring-1 ring-white/10">
            <HeartHandshake className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Nuevo seguimiento psicológico</h3>
            <p className="text-xs text-[var(--text-secondary)]">Record session notes and action items</p>
          </div>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/50 px-3 py-2 text-sm text-[var(--text-primary)]"
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
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/50 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <textarea
            value={acciones}
            onChange={(e) => setAcciones(e.target.value)}
            placeholder="Acciones acordadas (opcional)"
            rows={2}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/50 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <button
            type="submit"
            disabled={loading || !useApi}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:from-rose-500 hover:to-pink-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Registrar seguimiento
          </button>
          {!useApi ? (
            <p className="text-xs text-amber-400">
              Conecte la API (inicio de sesión + servidor) para persistir en base de datos.
            </p>
          ) : null}
        </form>
      </motion.section>

      {/* History */}
      <motion.section variants={cardVariants} initial="hidden" animate="visible" className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
            <HeartHandshake className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Historial de seguimiento</h3>
            <p className="text-xs text-[var(--text-secondary)]">Past sessions and intervention records</p>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-[var(--border-subtle)]">
          {records.length === 0 ? (
            <li className="py-6 text-center text-sm text-[var(--text-muted)]">Sin registros aún.</li>
          ) : (
            records.map((r) => (
              <li key={r.id} className="py-4">
                <p className="font-medium text-[var(--text-primary)]">
                  {r.student.nombres} {r.student.apellidos}{" "}
                  <span className="text-[var(--text-muted)]">· {r.student.codigo}</span>
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {new Date(r.fecha).toLocaleDateString("es-PE")} · {r.profesional ?? "—"}
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{r.resumen}</p>
                {r.acciones ? (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Acciones:</strong> {r.acciones}
                  </p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </motion.section>
    </div>
  );
}
