"use client";
import { useState } from "react";
import type { Student } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { api, type ApiPredictionResult } from "@/services/api";
import { INPUT_CLASS } from "@/lib/ui";
import { MlMetricsSection } from "./MlMetricsSection";

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
  return <section className="space-y-5"><h2 className="text-xl font-semibold">Predicción de riesgo</h2><p>El modelo utiliza notas, asistencia y eventos LMS registrados. Se requiere un modelo validado con el contrato 2026.</p>
    <label>Estudiante<select className={INPUT_CLASS} value={id} onChange={e => { setId(e.target.value); setPrediction(null); setError(""); }}><option value="">Seleccione</option>{students.map(s => <option key={s.id} value={s.id}>{s.codigo} · {s.nombres} {s.apellidos}</option>)}</select></label>
    <button className="btn-primary" disabled={!id || loading} onClick={() => void run()}>{loading ? "Calculando…" : "Generar predicción"}</button>
    {error && <p role="alert">{error}</p>}
    {prediction && <article className="premium-card p-5"><h3>Riesgo {prediction.level}</h3><p>Probabilidad estimada de clase alta: {(prediction.probability * 100).toFixed(1)}%</p><p>{prediction.recommendation}</p><p>Modelo: {prediction.modelName}</p><time>{prediction.predictedAt}</time></article>}
    {!students.length && <p>No hay estudiantes en su alcance.</p>}
    <MlMetricsSection />
  </section>;
}
