"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Brain } from "lucide-react";
import { api } from "@/services/api";
import { CardSkeleton } from "@/components/ui/Skeleton";

const COLORS = ["#818cf8", "#22d3ee", "#f59e0b", "#10b981"];

type ModelMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
};

const METRIC_KEYS = new Set([
  "accuracy",
  "precision",
  "recall",
  "f1_score",
  "confusion_matrix",
]);

function extractModels(raw: Record<string, unknown>): Record<string, ModelMetrics> {
  const out: Record<string, ModelMetrics> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (METRIC_KEYS.has(key) || key.startsWith("best_") || key === "features" || key === "class_labels") {
      continue;
    }
    if (val && typeof val === "object" && "f1_score" in (val as object)) {
      out[key] = val as ModelMetrics;
    }
  }
  return out;
}

export function MlMetricsSection() {
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.getMlMetrics();
        const metrics = res.metrics as Record<string, unknown> | null;
        if (metrics && typeof metrics === "object") setRaw(metrics);
        else setError("Entrene el modelo: npm run ml:train");
      } catch {
        setError("Servicio ML no disponible (puerto 5000).");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const data = useMemo(() => (raw ? extractModels(raw) : null), [raw]);
  const bestModel = (raw?.best_model as string) ?? "—";
  const features = (raw?.features as string[]) ?? [];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !data || !Object.keys(data).length) {
    return (
      <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/30 px-4 py-3 text-sm text-[var(--text-secondary)]">
        {error ?? "Sin métricas"} — Ejecute <code className="text-violet-400">npm run ml:train</code>
      </p>
    );
  }

  const compareData = Object.entries(data).map(([name, m]) => ({
    name: name.replaceAll("_", " "),
    accuracy: Math.round(m.accuracy * 1000) / 10,
    precision: Math.round(m.precision * 1000) / 10,
    recall: Math.round(m.recall * 1000) / 10,
    f1: Math.round(m.f1_score * 1000) / 10,
  }));

  const bestEntry = Object.entries(data).find(([k]) => k === bestModel);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-400" aria-hidden />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Comparación de modelos (ensemble learning)
          </h3>
        </div>
        <span className="badge bg-violet-500/15 text-violet-300">
          Mejor por F1: <strong>{bestModel.replaceAll("_", " ")}</strong>
          {bestEntry ? ` (${(bestEntry[1].f1_score * 100).toFixed(1)}%)` : ""}
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={compareData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <Tooltip
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "0.75rem",
              }}
            />
            <Legend />
            <Bar dataKey="accuracy" name="Accuracy" fill="#818cf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="precision" name="Precision" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            <Bar dataKey="recall" name="Recall" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="f1" name="F1" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {Object.entries(data).map(([name, m], idx) => (
          <article
            key={name}
            className={`rounded-xl border p-4 ${
              name === bestModel
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-[var(--border-subtle)] bg-[var(--surface)]/30"
            }`}
          >
            <h4 className="text-sm font-semibold capitalize text-[var(--text-primary)]">
              {name.replaceAll("_", " ")}
              {name === bestModel ? " ★" : ""}
            </h4>
            <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
              <li>Accuracy: {(m.accuracy * 100).toFixed(1)}%</li>
              <li>Precision: {(m.precision * 100).toFixed(1)}%</li>
              <li>Recall: {(m.recall * 100).toFixed(1)}%</li>
              <li>F1-score: {(m.f1_score * 100).toFixed(1)}%</li>
            </ul>
            <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
              Matriz de confusión
            </p>
            <pre className="mt-1 overflow-auto rounded bg-black/20 p-2 text-[10px] text-emerald-300/90">
              {JSON.stringify(m.confusion_matrix)}
            </pre>
            <span
              className="mt-2 inline-block h-1 w-full rounded-full opacity-60"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
          </article>
        ))}
      </div>

      {features.length > 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/20 p-4">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
            Variables del modelo (importancia por orden de entrada)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {features.map((f) => (
              <span key={f} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                {f}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
