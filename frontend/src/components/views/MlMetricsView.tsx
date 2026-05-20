"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Brain, Cpu } from "lucide-react";
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

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

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
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="premium-card rounded-2xl p-8 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
            <Brain className="h-6 w-6 text-violet-400" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{error ?? "Sin métricas"}</p>
          <p className="text-xs text-[var(--text-muted)]">
            Random Forest · XGBoost · Stacking (scikit-learn)
          </p>
        </div>
      </motion.div>
    );
  }

  const chartData = Object.entries(data).map(([name, m]) => ({
    name: name.replace("_", " "),
    f1: Math.round(m.f1_score * 1000) / 10,
  }));

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
              <Cpu className="h-4 w-4 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              ML Model Metrics
            </h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Ensemble learning performance comparison
          </p>
        </div>
      </motion.div>

      {/* Comparison Chart */}
      <motion.section variants={cardVariants} initial="hidden" animate="visible" className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-white/10">
            <Brain className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Comparación de modelos (ensemble learning)</h3>
            <p className="text-xs text-[var(--text-secondary)]">F1-score comparison across trained models</p>
          </div>
        </div>
        <div className="mt-5 h-64">
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
                  backdropFilter: "blur(12px)",
                }}
              />
              <Bar dataKey="f1" name="F1-score %" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Model Cards */}
      <section className="grid gap-4 lg:grid-cols-3">
        {Object.entries(data).map(([name, m], idx) => (
          <motion.article
            key={name}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: idx * 0.08 }}
            className="premium-card rounded-2xl p-5 md:p-6"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <h4 className="font-semibold capitalize text-[var(--text-primary)]">{name.replace("_", " ")}</h4>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-white/5">
                <dt className="text-xs text-[var(--text-muted)]">F1</dt>
                <dd className="font-bold text-violet-400">{(m.f1_score * 100).toFixed(1)}%</dd>
              </div>
              <div className="rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-white/5">
                <dt className="text-xs text-[var(--text-muted)]">Accuracy</dt>
                <dd className="font-bold text-[var(--text-primary)]">{(m.accuracy * 100).toFixed(1)}%</dd>
              </div>
            </dl>
            <pre className="mt-4 rounded-lg bg-[var(--surface-deep)] p-3 text-xs text-emerald-300">
              {JSON.stringify(m.confusion_matrix)}
            </pre>
          </motion.article>
        ))}
      </section>
    </div>
  );
}
