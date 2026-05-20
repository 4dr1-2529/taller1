"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { BrainCircuit, FlaskConical, Server } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { computePrediction, simulateScenario } from "@/lib/risk-engine";
import { toRiskEngineStatus } from "@/lib/status";
import type { ScenarioDeltas, Student } from "@/types/academic";
import { SELECT_CLASS, INPUT_CLASS } from "@/lib/ui";

function levelStyles(level: string) {
  return clsx(
    "text-3xl font-bold capitalize",
    level === "alto" && "text-rose-600",
    level === "medio" && "text-amber-600",
    level === "bajo" && "text-emerald-600",
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

  if (!student || !base || !simulated) {
    return <p className="text-sm text-slate-600">No hay datos de estudiantes.</p>;
  }

  return (
    <div className="space-y-6">
      <section className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <BrainCircuit className="h-5 w-5 text-indigo-600" aria-hidden />
              Módulo de predicción (ensemble)
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              El score (0–100) agrega factores académicos, asistencia, LMS y tareas. Con el servicio{" "}
              <strong>machine-learning</strong> (Python) se usan probabilidades calibradas del modelo
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

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Resultado actual
            </p>
            <p className={levelStyles(base.level)}>{base.level}</p>
            <p className="mt-2 text-sm text-slate-600">
              Score numérico:{" "}
              <span className="font-semibold text-slate-900">{Math.round(base.score)}</span> / 100
            </p>
            <ul className="mt-4 space-y-2">
              {base.factors.map((f) => (
                <li key={f.key}>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{f.label}</span>
                    <span>{Math.round(f.contribution)} pts</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${Math.min(100, f.contribution)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">
              Interpretabilidad
            </p>
            <p className="mt-2 text-sm text-indigo-950/90">
              {typeof base.meta?.descripcion === "string" ? base.meta.descripcion : ""}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-indigo-950/90">
              {(Array.isArray(base.meta?.notas) ? base.meta.notas : []).map((n: string) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-indigo-900/90">
              {Object.entries(base.meta?.pesos ?? {}).map(([k, v]) => (
                <div key={k} className="flex justify-between rounded-lg bg-white/60 px-2 py-1">
                  <dt className="capitalize">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-amber-600" aria-hidden />
          <h3 className="text-base font-semibold text-slate-900">Simulación de escenarios</h3>
        </div>
        <p className="text-sm text-slate-600">
          Ajusta mejoras hipotéticas para ver el impacto en el score (útil para planes de intervención).
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-700">Δ Promedio general (0–20)</span>
            <input
              type="range"
              min={0}
              max={4}
              step={0.5}
              value={deltaPromedio}
              onChange={(e) => setDeltaPromedio(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <span className="text-xs text-slate-500">+{deltaPromedio.toFixed(1)} puntos</span>
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">Δ Asistencia (%)</span>
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={deltaAsistencia}
              onChange={(e) => setDeltaAsistencia(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <span className="text-xs text-slate-500">+{deltaAsistencia}%</span>
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">Δ Actividad LMS (cada semana, 0–100)</span>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={deltaLms}
              onChange={(e) => setDeltaLms(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <span className="text-xs text-slate-500">+{deltaLms} pts de actividad</span>
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">Tareas adicionales entregadas</span>
            <input
              type="range"
              min={0}
              max={Math.max(student.metrics.lms.tareasTotales - student.metrics.lms.tareasEntregadas, 0)}
              step={1}
              value={tareasExtra}
              onChange={(e) => setTareasExtra(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <span className="text-xs text-slate-500">+{tareasExtra} entregas</span>
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Proyección</p>
            <p className={levelStyles(simulated.level)}>{simulated.level}</p>
            <p className="text-sm text-slate-600">
              Nuevo score:{" "}
              <span className="font-semibold text-slate-900">{Math.round(simulated.score)}</span> / 100
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Δ respecto al actual: {(simulated.score - base.score).toFixed(1)} puntos
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-950">
            <p className="font-semibold">Lectura para la tesis</p>
            <p className="mt-2">
              La descomposición por factores permite explicar el “por qué” del riesgo (similar a importancia
              de variables en modelos de árbol). Al migrar a Python, se pueden reportar SHAP o importancia
              Gini/permutación por modelo base.
            </p>
          </div>
        </div>
      </section>

      <section className="premium-card rounded-2xl p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-slate-700" aria-hidden />
            <div>
              <h3 className="text-base font-semibold text-slate-900">Predicción en servidor</h3>
              <p className="text-sm text-slate-600">
                API Express <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">POST /api/v1/predict</code>{" "}
                — motor local o <strong>machine-learning</strong> si está activo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void runApiPrediction()}
            disabled={apiLoading || !useApi || !api.hasToken}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {apiLoading ? "Consultando…" : "Ejecutar predicción vía API"}
          </button>
        </div>
        {apiJson ? (
          <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-100">
            {apiJson}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
