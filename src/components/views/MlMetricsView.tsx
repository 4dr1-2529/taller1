"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Brain } from "lucide-react";
import { api } from "@/services/api";
import { CardSkeleton } from "@/components/ui/Skeleton";

const COLORS = ["#6366f1", "#06b6d4", "#f59e0b"];

type ModelMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
};

export function MlMetricsView() {
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
        setError("API o ML service no disponible. Ejecute: npm run dev");
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
      <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-600">
        <Brain className="mx-auto mb-3 h-10 w-10 text-indigo-500" />
        <p>{error ?? "Sin métricas"}</p>
        <p className="mt-2 text-xs text-slate-500">
          Random Forest · XGBoost · Stacking (scikit-learn)
        </p>
      </div>
    );
  }

  const chartData = Object.entries(data).map(([name, m]) => ({
    name: name.replace("_", " "),
    f1: Math.round(m.f1_score * 1000) / 10,
  }));

  return (
    <div className="space-y-6">
      <section className="glass-card rounded-2xl p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Brain className="h-5 w-5 text-indigo-600" />
          Comparación de modelos (ensemble learning)
        </h3>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis unit="%" domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="f1" name="F1-score %" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {Object.entries(data).map(([name, m]) => (
          <article key={name} className="glass-card rounded-2xl p-5">
            <h4 className="font-semibold capitalize">{name.replace("_", " ")}</h4>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-slate-500">F1</dt>
                <dd className="font-bold text-indigo-600">{(m.f1_score * 100).toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="text-slate-500">Accuracy</dt>
                <dd className="font-bold">{(m.accuracy * 100).toFixed(1)}%</dd>
              </div>
            </dl>
            <pre className="mt-4 rounded-lg bg-slate-950 p-3 text-xs text-emerald-200">
              {JSON.stringify(m.confusion_matrix)}
            </pre>
          </article>
        ))}
      </section>
    </div>
  );
}
