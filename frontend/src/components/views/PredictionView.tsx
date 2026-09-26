"use client";

import { useMemo, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import type { Student } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { api, type ApiPredictionResult } from "@/services/api";
import { INPUT_CLASS } from "@/lib/ui";
import { MlMetricsSection } from "./MlMetricsSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSection } from "@/components/ui/PageSection";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { PredictionResultSkeleton } from "@/components/ui/Skeleton";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { ExperimentalBadge, ExperimentalNote } from "@/components/ui/ExperimentalBadge";
import { formatContributionPoints, dataModeLabel } from "@/lib/prediction-display";

const LEVEL_LABEL: Record<string, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

/**
 * Nombres legibles de las 7 features canónicas del contrato V6
 * (promedio_general, cursos_desaprobados, asistencia_general,
 * frecuencia_acceso_lms, tiempo_interaccion_lms, actividades_realizadas,
 * recursos_consultados). Fallback humanizado para claves no listadas.
 */
const FEATURE_LABEL: Record<string, string> = {
  promedio_general: "Promedio general (0–20)",
  cursos_desaprobados: "Cursos desaprobados",
  asistencia_general: "Asistencia general (%)",
  frecuencia_acceso_lms: "Frecuencia de acceso LMS",
  tiempo_interaccion_lms: "Tiempo de interacción LMS",
  actividades_realizadas: "Actividades realizadas",
  recursos_consultados: "Recursos consultados",
};

const FRIENDLY_KEYS = new Set(["modelVersion", "datasetVersion", "dataMode", "contractVersion", "decisionThreshold"]);

function featureLabel(key: string): string {
  return (
    FEATURE_LABEL[key] ??
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function featureValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "");
  }
  if (typeof value === "object") return "—";
  return String(value);
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

type PredictionViewProps = {
  students: Student[];
  secciones?: SeccionOption[];
  useApi?: boolean;
  studentsPreFiltered?: boolean;
  hideAcademicFilters?: boolean;
};

export function PredictionView({ students }: PredictionViewProps) {
  const [id, setId] = useState("");
  const [prediction, setPrediction] = useState<ApiPredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const student = useMemo(() => students.find((s) => s.id === id), [students, id]);

  async function run() {
    if (!id) return;
    setLoading(true);
    setError("");
    setPrediction(null);
    try {
      const result = await api.call<{ prediction: ApiPredictionResult }>("/predict", {
        method: "POST",
        body: JSON.stringify({ studentId: id }),
      });
      setPrediction(result.prediction);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "No se pudo calcular la estimación. Intente nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Modelo experimental"
        title="Evaluación individual de riesgo"
        description="El modelo experimental estima la probabilidad de deserción a partir de 7 indicadores académicos (notas, asistencia y eventos LMS). Requiere un modelo validado con el contrato 2026."
        badges={
          <ExperimentalBadge
            dataMode={prediction?.dataMode}
            datasetVersion={prediction?.datasetVersion}
          />
        }
      />

      <PageSection
        variant="form"
        title="Generar estimación"
        description="Seleccione un estudiante de su alcance para calcular la probabilidad de deserción."
        icon={Sparkles}
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <label
              htmlFor="prediction-student"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
            >
              Estudiante
            </label>
            <select
              id="prediction-student"
              className={INPUT_CLASS}
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setPrediction(null);
                setError("");
              }}
            >
              <option value="">Seleccione un estudiante</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo} · {s.nombres} {s.apellidos}
                </option>
              ))}
            </select>
            {!students.length ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                No hay estudiantes disponibles en su alcance.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="btn-primary inline-flex items-center justify-center gap-2"
            disabled={!id || loading}
            onClick={() => void run()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Wand2 className="h-4 w-4" aria-hidden />
            )}
            {loading ? "Calculando…" : "Generar predicción"}
          </button>
        </div>
      </PageSection>

      {loading ? <PredictionResultSkeleton /> : null}

      {!loading && error ? (
        <ErrorState
          message={error}
          technicalDetail={`POST /predict studentId=${id || "n/d"}`}
          onRetry={() => void run()}
          retryLabel="Reintentar"
        />
      ) : null}

      {!loading && !error && !prediction && students.length ? (
        <EmptyState
          icon={Sparkles}
          title="Aún no se ha generado una estimación"
          description="Elija un estudiante y pulse «Generar predicción» para ver la probabilidad de deserción, los indicadores utilizados y la trazabilidad del modelo."
        />
      ) : null}

      {!students.length ? (
        <EmptyState
          title="Sin estudiantes en su alcance"
          description="Cuando existan estudiantes asignados a su perfil, podrá generar estimaciones de riesgo desde esta pantalla."
        />
      ) : null}

      <div aria-live="polite">
        {!loading && prediction ? (
          <PredictionResult prediction={prediction} student={student} />
        ) : null}
      </div>

      <MlMetricsSection />
    </section>
  );
}

function PredictionResult({
  prediction,
  student,
}: {
  prediction: ApiPredictionResult;
  student?: Student;
}) {
  const level = (prediction.level ?? "bajo").toLowerCase();
  const levelLabel = LEVEL_LABEL[level] ?? level;

  const probability =
    prediction.probability != null && Number.isFinite(prediction.probability)
      ? prediction.probability
      : prediction.probabilityAbandono != null && Number.isFinite(prediction.probabilityAbandono)
        ? prediction.probabilityAbandono
        : null;

  const score = Number.isFinite(prediction.score) ? prediction.score : probability != null ? probability * 100 : 0;

  const factors = prediction.factors?.length
    ? prediction.factors
    : prediction.factores_riesgo ?? [];

  const inputData = (prediction.inputData ?? prediction.datos_ingresados ?? {}) as Record<
    string,
    unknown
  >;
  const variables = Object.entries(inputData).filter(([k]) => !FRIENDLY_KEYS.has(k));

  const trace: { label: string; value: string }[] = [
    { label: "Modelo", value: prediction.modelName || prediction.modelo_usado || "—" },
    { label: "Versión del modelo", value: prediction.modelVersion ?? "—" },
    { label: "Origen de datos", value: dataModeLabel(prediction.dataMode) },
    { label: "Versión del dataset", value: prediction.datasetVersion ?? "—" },
    { label: "Contrato de predicción", value: prediction.contractVersion ?? "—" },
    {
      label: "Umbral de decisión",
      value:
        prediction.decisionThreshold != null && Number.isFinite(prediction.decisionThreshold)
          ? prediction.decisionThreshold.toFixed(2)
          : "—",
    },
    { label: "Fecha de cálculo", value: formatDate(prediction.predictedAt || prediction.fecha_prediccion) },
  ];

  return (
    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--card-shadow)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--accent-muted)] px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="intelligence-eyebrow">Resultado de la estimación</p>
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {student ? `${student.nombres} ${student.apellidos}` : "Estudiante seleccionado"}
            {student?.codigo ? (
              <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">{student.codigo}</span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={level} score={score} />
          <ExperimentalBadge
            dataMode={prediction.dataMode}
            datasetVersion={prediction.datasetVersion}
            compact
          />
        </div>
      </header>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-5">
        {/* Medidor */}
        <div className="lg:col-span-2">
          <RiskGauge score={score} level={level} />
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Probabilidad
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">
                {probability != null ? `${(probability * 100).toFixed(1)}%` : "—"}
              </dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Nivel de riesgo
              </dt>
              <dd className="mt-1 text-lg font-bold text-[var(--text-primary)]">{levelLabel}</dd>
            </div>
          </dl>
        </div>

        {/* Lectura del resultado */}
        <div className="space-y-5 lg:col-span-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Recomendación
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-primary)]">
              {prediction.recommendation || prediction.recomendacion || "Sin recomendación registrada."}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Indicadores utilizados por el modelo
            </h4>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Variables con mayor peso en esta estimación; no representan la causa de la deserción.
            </p>
            {factors.length ? (
              <ul className="mt-3 space-y-3">
                {factors.map((f) => {
                  const width = Math.min(100, Math.max(0, Math.abs(f.contribution ?? 0)));
                  return (
                    <li key={f.key ?? f.label}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">{f.label}</span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
                          {formatContributionPoints(f.contribution ?? 0)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--brand-orange)]"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                El modelo no devolvió indicadores para esta estimación.
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Variables registradas en la evaluación
            </h4>
            {variables.length ? (
              <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {variables.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-3 border-b border-dashed border-[var(--border-subtle)] pb-1.5"
                  >
                    <dt className="text-xs text-[var(--text-secondary)]">{featureLabel(k)}</dt>
                    <dd className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                      {featureValue(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                No se registraron variables en esta respuesta.
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Trazabilidad</h4>
            <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {trace.map((t) => (
                <div
                  key={t.label}
                  className="flex items-baseline justify-between gap-3 border-b border-dashed border-[var(--border-subtle)] pb-1.5"
                >
                  <dt className="text-xs text-[var(--text-secondary)]">{t.label}</dt>
                  <dd className="truncate text-xs font-semibold text-[var(--text-primary)]" title={t.value}>
                    {t.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              <time dateTime={prediction.predictedAt}>
                {formatDate(prediction.predictedAt || prediction.fecha_prediccion)}
              </time>
            </p>
          </div>

          <ExperimentalNote
            dataMode={prediction.dataMode}
            datasetVersion={prediction.datasetVersion}
            modelVersion={prediction.modelVersion}
          />
        </div>
      </div>
    </article>
  );
}
