"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Brain } from "lucide-react";
import { api } from "@/services/api";
import { CardSkeleton } from "@/components/ui/Skeleton";

const COLORS = ["#818cf8", "#22d3ee", "#f59e0b"];

type ModelMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
};

export function MlMetricsSection() {
  const [data, setData] = useState<Record<string, ModelMetrics> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.getMlMetrics();
        const models = (res.metrics as { models?: Record<string, ModelMetrics> })?.models;
        if (models) setData(models);
        else setError("Entrene el modelo: npm run ml:train");
      } catch {
        setError("Servicio ML no disponible. Ejecute npm run dev con el stack completo.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/30 px-4 py-3 text-sm text-[var(--text-secondary)]">
        {error ?? "Sin métricas"} — Random Forest, XGBoost y stacking (scikit-learn).
      </p>
    );
  }

  const chartData = Object.entries(data).map(([name, m]) => ({
    name: name.replace("_", " "),
    f1: Math.round(m.f1_score * 1000) / 10,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-violet-400" aria-hidden />
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Métricas del modelo entrenado</h3>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip
              wrapperClassName="chart-tooltip"
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "0.75rem",
              }}
            />
            <Bar dataKey="f1" name="F1 %" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(data).map(([name, m], idx) => (
          <article
            key={name}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/30 p-4"
          >
            <h4 className="text-sm font-semibold capitalize text-[var(--text-primary)]">
              {name.replace("_", " ")}
            </h4>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              F1 {(m.f1_score * 100).toFixed(1)}% · Exactitud {(m.accuracy * 100).toFixed(1)}%
            </p>
            <span
              className="mt-2 inline-block h-1.5 w-8 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
