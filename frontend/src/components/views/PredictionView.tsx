"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { BrainCircuit, FlaskConical, Server } from "lucide-react";
import { MlMetricsSection } from "@/components/views/MlMetricsSection";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { toast } from "sonner";
import { api } from "@/services/api";
import { computePrediction, simulateScenario } from "@/lib/risk-engine";
import { toRiskEngineStatus } from "@/lib/status";
import type { ScenarioDeltas, Student } from "@/types/academic";
import { SELECT_CLASS, INPUT_CLASS } from "@/lib/ui";

function levelStyles(level: string) {
  return clsx(
    "text-3xl font-bold capitalize",
    level === "alto" && "text-rose-400",
    level === "medio" && "text-amber-400",
    level === "bajo" && "text-emerald-400",
  );
}

type PredictionViewProps = {
  students: Student[];
  useApi?: boolean;
};

export function PredictionView({ students, useApi = false }: PredictionViewProps) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [deltaPromedio, setDeltaPromedio] = useState(0);
  const [deltaAsistencia, setDeltaAsistencia] = useState(0);
  const [deltaLms, setDeltaLms] = useState(0);
  const [tareasExtra, setTareasExtra] = useState(0);
  const [apiJson, setApiJson] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const student = useMemo(
    () => students.find((s) => s.id === studentId) ?? students[0],
    [students, studentId],
  );

  const base = useMemo(() => {
    if (!student) return null;
    return computePrediction(student.metrics, toRiskEngineStatus(student.estado));
  }, [student]);

  const scenarioDeltas: ScenarioDeltas = useMemo(
    () => ({
      promedioDelta: deltaPromedio,
      asistenciaDelta: deltaAsistencia,
      lmsActividadDelta: deltaLms,
      tareasEntregadasExtra: tareasExtra,
    }),
    [deltaPromedio, deltaAsistencia, deltaLms, tareasExtra],
  );

  const simulated = useMemo(() => {
    if (!student) return null;
    return simulateScenario(
      student.metrics,
      toRiskEngineStatus(student.estado),
      scenarioDeltas,
    );
  }, [student, scenarioDeltas]);

  async function runApiPrediction() {
    if (!student) return;
    if (!useApi || !api.hasToken) {
      toast.error("Inicie sesión para ejecutar predicción en el servidor");
      return;
    }
    setApiLoading(true);
    setApiJson(null);
    try {
      const res = await api.predict(student.id);
      setApiJson(JSON.stringify(res, null, 2));
      toast.success(`Predicción (${res.source})`);
    } catch (e) {
      setApiJson(String(e));
      toast.error("Error en predicción");
    } finally {
      setApiLoading(false);
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  if (!student || !base || !simulated) {
    return <p className="text-sm text-[var(--text-muted)]">No hay datos de estudiantes.</p>;
  }

  return (
    <div className="space-y-8">
      <motion.section variants={cardVariants} initial="hidden" animate="visible" className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
              <BrainCircuit className="h-5 w-5 text-violet-400" aria-hidden />
              Módulo de predicción (modelo conjunto)
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
              El puntaje (0–100) agrega factores académicos, asistencia, plataforma virtual y tareas. Con el servicio{" "}
              <strong className="text-[var(--text-primary)]">machine-learning</strong> (Python) se usan probabilidades calibradas del modelo
              entrenado.
            </p>
          </div>
          <select
            className={clsx(SELECT_CLASS, "w-full lg:w-72")}
            value={student.id}
            onChange={(e) => {
              setStudentId(e.target.value);
              setDeltaPromedio(0);
              setDeltaAsistencia(0);
              setDeltaLms(0);
              setTareasExtra(0);
            }}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombres} {s.apellidos}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="chart-panel flex flex-col items-center justify-center p-4 lg:col-span-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Riesgo actual
            </p>
            <RiskGauge score={base.score} level={base.level} />
          </article>

          <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/30 p-4 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Factores de ponderación
            </p>
            <p className={clsx("mt-1 text-sm capitalize", levelStyles(base.level))}>Nivel {base.level}</p>
            <ul className="mt-4 space-y-2">
              {base.factors.map((f) => (
                <li key={f.key}>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                    <span>{f.label}</span>
                    <span>{Math.round(f.contribution)} pts</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                      style={{ width: `${Math.min(100, f.contribution)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </article>

          {/* Interpretability */}
          <article className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
              Interpretabilidad
            </p>
            <p className="mt-2 text-sm text-violet-200/80">
              {typeof base.meta?.descripcion === "string" ? base.meta.descripcion : ""}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-violet-200/80">
              {(Array.isArray(base.meta?.notas) ? base.meta.notas : []).map((n: string) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-violet-200/80">
              {Object.entries(base.meta?.pesos ?? {}).map(([k, v]) => (
                <div key={k} className="flex justify-between rounded-lg bg-white/5 px-2 py-1">
                  <dt className="capitalize">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </motion.section>

      {/* Scenario Simulation */}
      <motion.section variants={cardVariants} initial="hidden" animate="visible" className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-amber-400" aria-hidden />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Simulación de escenarios</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Ajuste mejoras hipotéticas para ver el impacto en el puntaje (útil para planes de intervención).
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Δ Promedio general (0–20)</span>
            <input
              type="range"
              min={0}
              max={4}
              step={0.5}
              value={deltaPromedio}
              onChange={(e) => setDeltaPromedio(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <span className="text-xs text-[var(--text-muted)]">+{deltaPromedio.toFixed(1)} puntos</span>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Δ Asistencia (%)</span>
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={deltaAsistencia}
              onChange={(e) => setDeltaAsistencia(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <span className="text-xs text-[var(--text-muted)]">+{deltaAsistencia}%</span>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Δ Actividad en plataforma (cada semana, 0–100)</span>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={deltaLms}
              onChange={(e) => setDeltaLms(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <span className="text-xs text-[var(--text-muted)]">+{deltaLms} pts de actividad</span>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Tareas adicionales entregadas</span>
            <input
              type="range"
              min={0}
              max={Math.max(student.metrics.lms.tareasTotales - student.metrics.lms.tareasEntregadas, 0)}
              step={1}
              value={tareasExtra}
              onChange={(e) => setTareasExtra(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <span className="text-xs text-[var(--text-muted)]">+{tareasExtra} entregas</span>
          </label>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/30 p-4">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Proyección</p>
          <p className={levelStyles(simulated.level)}>{simulated.level}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Nuevo puntaje:{" "}
            <span className="font-semibold text-[var(--text-primary)]">{Math.round(simulated.score)}</span> / 100
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Cambio respecto al actual: {(simulated.score - base.score).toFixed(1)} puntos
          </p>
        </div>
      </motion.section>

      {/* Server Prediction */}
      <motion.section variants={cardVariants} initial="hidden" animate="visible" className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-[var(--text-secondary)]" aria-hidden />
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Predicción en servidor</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                API Express <code className="rounded bg-white/5 px-1 py-0.5 text-xs">POST /api/v1/predict</code>{" "}
                — motor local o <strong className="text-[var(--text-primary)]">machine-learning</strong> si está activo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void runApiPrediction()}
            disabled={apiLoading || !useApi || !api.hasToken}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60"
          >
            {apiLoading ? "Consultando…" : "Ejecutar predicción en servidor"}
          </button>
        </div>
        {apiJson ? (
          <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-[var(--surface-deep)] p-4 text-xs text-emerald-300">
            {apiJson}
          </pre>
        ) : null}
      </motion.section>

      <motion.section variants={cardVariants} initial="hidden" animate="visible" className="premium-card rounded-2xl p-5 md:p-6">
        <MlMetricsSection />
      </motion.section>
    </div>
  );
}
