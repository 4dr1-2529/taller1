"use client";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useState } from "react";
import type { Student } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { api, type ApiPredictionResult } from "@/services/api";
import { INPUT_CLASS } from "@/lib/ui";
import { MlMetricsSection } from "./MlMetricsSection";
import { ExperimentalBadge, ExperimentalNote } from "@/components/ui/ExperimentalBadge";

export function PredictionView({ students }: { students: Student[]; secciones?: SeccionOption[]; useApi?: boolean; studentsPreFiltered?: boolean; hideAcademicFilters?: boolean }) {
  const [id, setId] = useState("");
  const [prediction, setPrediction] = useState<ApiPredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setLoading(true); setError(""); setPrediction(null);
    try { const result = await api.call<{ prediction: ApiPredictionResult }>("/predict", { method: "POST", body: JSON.stringify({ studentId: id }) }); setPrediction(result.prediction); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo predecir"); }
    finally { setLoading(false); }
  }
  return <section className="space-y-5">
    <SectionHeading title="Predicción de riesgo de deserción" />
    <p>El modelo experimental estima la probabilidad de deserción a partir de 7 indicadores académicos (notas, asistencia y eventos LMS). Requiere un modelo validado con el contrato 2026.</p>
    <ExperimentalBadge dataMode={prediction?.dataMode} datasetVersion={prediction?.datasetVersion} />
    <label>Estudiante<select className={INPUT_CLASS} value={id} onChange={e => { setId(e.target.value); setPrediction(null); setError(""); }}><option value="">Seleccione</option>{students.map(s => <option key={s.id} value={s.id}>{s.codigo} · {s.nombres} {s.apellidos}</option>)}</select></label>
    <button className="btn-primary" disabled={!id || loading} onClick={() => void run()}>{loading ? "Calculando…" : "Generar predicción"}</button>
    {error && <p role="alert">{error}</p>}
    {prediction && (
      <article className="premium-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3>
            Riesgo {prediction.level}
          </h3>
          <ExperimentalBadge dataMode={prediction.dataMode} datasetVersion={prediction.datasetVersion} compact />
        </div>
        <p>
          Probabilidad estimada de deserción:{" "}
          {prediction.probability != null && Number.isFinite(prediction.probability)
            ? `${(prediction.probability * 100).toFixed(1)}%`
            : "—"}
        </p>
        <p>{prediction.recommendation}</p>
        <p>
          Modelo: {prediction.modelName}
          {prediction.modelVersion ? ` · ${prediction.modelVersion}` : ""}
        </p>
        <time dateTime={prediction.predictedAt}>
          {Number.isNaN(Date.parse(prediction.predictedAt))
            ? prediction.predictedAt
            : new Date(prediction.predictedAt).toLocaleString("es-PE")}
        </time>
        <ExperimentalNote
          dataMode={prediction.dataMode}
          datasetVersion={prediction.datasetVersion}
          modelVersion={prediction.modelVersion}
        />
      </article>
    )}
    {!students.length && <p>No hay estudiantes en su alcance.</p>}
    <MlMetricsSection />
  </section>;
}
