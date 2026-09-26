"use client";
import { ChartCategoryTick } from "@/components/ui/ChartCategoryTick";

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
import { ExperimentalBadge } from "@/components/ui/ExperimentalBadge";

const COLORS = ["var(--chart-primary)", "var(--chart-secondary)", "var(--risk-medium)", "var(--risk-low)"];

type ModelMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  balanced_accuracy?: number;
  roc_auc?: number;
  pr_auc?: number;
  brier?: number;
  confusion_matrix: number[][];
  threshold?: number;
};

const METRIC_KEYS = new Set([
  "accuracy",
  "precision",
  "recall",
  "f1_score",
  "balanced_accuracy",
  "roc_auc",
  "pr_auc",
  "brier",
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
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.getMlMetrics();
        const metrics = res.metrics as Record<string, unknown> | null;
        if (metrics && typeof metrics === "object") setRaw(metrics);
      } catch {
        setUnreachable(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const data = useMemo(() => (raw ? extractModels(raw) : null), [raw]);
  const bestModel = (raw?.best_model as string) ?? "—";
  const features = (raw?.features as string[]) ?? [];
  const dataMode = (raw?.data_mode as string | undefined) ?? null;
  const datasetVersion = (raw?.dataset_version as string | undefined) ?? null;
  const modelVersion = (raw?.model_version as string | undefined) ?? null;
  const holdout = useMemo(() => {
    const h = raw?.holdout_results as Record<string, ModelMetrics> | undefined;
    if (!h || typeof h !== "object") return null;
    const best = h[bestModel];
    return best ?? (Object.values(h)[0] as ModelMetrics | undefined) ?? null;
  }, [raw, bestModel]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!data || !Object.keys(data).length) {
    return (
      <div className="space-y-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/30 px-4 py-3 text-sm text-[var(--text-secondary)]">
        <p className="font-semibold text-[var(--text-primary)]">Métricas del modelo aún no disponibles</p>
        {unreachable ? (
          <>
            <p>No se pudo consultar el estado del modelo predictivo.</p>
            <p>Intente nuevamente más tarde.</p>
          </>
        ) : (
          <>
            <p>El modelo predictivo está pendiente de entrenamiento y validación con un conjunto de datos autorizado.</p>
            <p>Las funciones académicas del sistema continúan disponibles normalmente.</p>
          </>
        )}
      </div>
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
          <Brain className="h-5 w-5 text-[var(--accent)]" aria-hidden />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Comparación de modelos (ensemble learning)
          </h3>
          <ExperimentalBadge dataMode={dataMode} datasetVersion={datasetVersion} compact />
        </div>
        <span className="badge badge-info">
          Mejor por F1 (validación): <strong>{bestModel.replaceAll("_", " ")}</strong>
          {bestEntry ? ` (${(bestEntry[1].f1_score * 100).toFixed(1)}%)` : ""}
        </span>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Selección por el conjunto de validación · umbral de decisión afinado solo en validación ·
        evaluación final en holdout.
        {datasetVersion ? ` Dataset ${datasetVersion}.` : ""}
        {modelVersion ? ` Modelo ${modelVersion}.` : ""}
      </p>

      <div className="h-80 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={compareData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="name" height={80} tick={<ChartCategoryTick />} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
            <Tooltip
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "0.75rem",
              }}
            />
            <Legend />
            <Bar isAnimationActive={false} dataKey="accuracy" name="Accuracy" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} />
            <Bar isAnimationActive={false} dataKey="precision" name="Precision" fill="var(--chart-secondary)" radius={[4, 4, 0, 0]} />
            <Bar isAnimationActive={false} dataKey="recall" name="Recall" fill="var(--risk-medium)" radius={[4, 4, 0, 0]} />
            <Bar isAnimationActive={false} dataKey="f1" name="F1" fill="var(--risk-low)" radius={[4, 4, 0, 0]} />
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
              {m.balanced_accuracy != null && <li>Balanced acc.: {(m.balanced_accuracy * 100).toFixed(1)}%</li>}
              {m.roc_auc != null && <li>ROC-AUC: {m.roc_auc.toFixed(4)}</li>}
              {m.pr_auc != null && <li>PR-AUC: {m.pr_auc.toFixed(4)}</li>}
              {m.brier != null && <li>Brier: {m.brier.toFixed(4)}</li>}
              {m.threshold != null && <li>Umbral: {m.threshold.toFixed(2)}</li>}
            </ul>
            <p className="mt-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Matriz de confusión
            </p>
            <pre className="mt-1 overflow-auto rounded bg-black/20 p-2 text-xs text-[var(--risk-low)]">
              {JSON.stringify(m.confusion_matrix)}
            </pre>
            <span
              className="mt-2 inline-block h-1 w-full rounded-full opacity-60"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
          </article>
        ))}
      </div>

      {holdout ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
              Evaluación final · holdout (una sola vez, sin usar para selección)
            </p>
            <ExperimentalBadge dataMode={dataMode} datasetVersion={datasetVersion} compact />
          </div>
          <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm text-[var(--text-secondary)] sm:grid-cols-2 lg:grid-cols-4">
            <li>Accuracy: {(holdout.accuracy * 100).toFixed(1)}%</li>
            <li>Precision: {(holdout.precision * 100).toFixed(1)}%</li>
            <li>Recall: {(holdout.recall * 100).toFixed(1)}%</li>
            <li>F1: {(holdout.f1_score * 100).toFixed(1)}%</li>
            <li>Balanced acc.: {((holdout.balanced_accuracy ?? 0) * 100).toFixed(1)}%</li>
            <li>ROC-AUC: {(holdout.roc_auc ?? 0).toFixed(4)}</li>
            <li>PR-AUC: {(holdout.pr_auc ?? 0).toFixed(4)}</li>
            <li>Brier: {(holdout.brier ?? 0).toFixed(4)}</li>
          </ul>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Matriz de confusión: {JSON.stringify(holdout.confusion_matrix)} (TN, FP / FN, TP) ·
            objetivo binario: deserción.
          </p>
        </div>
      ) : null}

      {features.length > 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/20 p-4">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
            Variables del modelo (importancia del Random Forest · señal observada)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {features.map((f) => (
              <span key={f} className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                {f}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
