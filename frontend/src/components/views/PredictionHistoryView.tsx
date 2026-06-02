"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, type ApiPredictionHistoryItem } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import { EmptyState } from "@/components/EmptyState";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import type { Student } from "@/types/academic";
import { SELECT_CLASS } from "@/lib/ui";

type PredictionHistoryViewProps = {
  students: Student[];
};

export function PredictionHistoryView({ students }: PredictionHistoryViewProps) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<ApiPredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const res = await api.getPredictions({
        studentId: studentId || undefined,
        limit: 50,
      });
      setItems(res.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar historial");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  if (!isAuthenticated) {
    return <EmptyState title="Historial de predicciones" description="Inicie sesión." showLogin />;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-400" />
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Historial de predicciones</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Registros persistidos: score, nivel, factores, modelo y recomendación
            </p>
          </div>
        </div>
        <button type="button" className="btn-secondary" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </motion.div>

      <div className="premium-card rounded-2xl p-4">
        <label className="block text-sm">
          <span className="mb-1 text-[var(--text-muted)]">Filtrar por estudiante</span>
          <select className={SELECT_CLASS} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Todos (según su rol)</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.codigo} — {s.nombres} {s.apellidos}
              </option>
            ))}
          </select>
        </label>
      </div>

      <DataTablePanel
        title={`Registros (${items.length})`}
        description={loading ? "Cargando…" : "Últimas predicciones guardadas en base de datos"}
        isEmpty={!loading && items.length === 0}
        emptyMessage="Sin predicciones. Ejecute una predicción en el módulo Predicción."
      >
        <TableWrap>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estudiante</th>
              <th>Score</th>
              <th>Nivel</th>
              <th>Modelo</th>
              <th>Recomendación</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td className="text-xs whitespace-nowrap">
                  {new Date(p.createdAt).toLocaleString("es-PE")}
                </td>
                <td>
                  {p.student
                    ? `${p.student.nombres} ${p.student.apellidos}`
                    : p.studentId.slice(0, 8)}
                </td>
                <td className="font-semibold tabular-nums">{p.score.toFixed(1)}</td>
                <td>
                  <RiskBadge level={p.level} score={p.score} />
                </td>
                <td className="text-xs">{p.modelName}</td>
                <td className="max-w-xs text-xs text-[var(--text-secondary)]">
                  {p.meta?.recommendation ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </DataTablePanel>
    </div>
  );
}
