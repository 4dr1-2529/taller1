"use client";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { INPUT_CLASS } from "@/lib/ui";

const labels: Record<string, string> = {
  promedio_general: "Promedio general", cursos_desaprobados: "Cursos desaprobados", asistencia_general: "Asistencia (%)",
  frecuencia_acceso_lms: "Accesos por semana (últimos 28 días)", tiempo_interaccion_lms: "Horas de interacción observada (28 días)",
  actividades_realizadas: "Actividades completadas (28 días)", recursos_consultados: "Materiales distintos consultados (28 días)",
  dias_activos: "Días activos (28 días)", ultimo_acceso: "Última actividad", ventana_desde: "Desde", ventana_hasta: "Hasta",
};
export function ObservedProgressView() {
  const [students, setStudents] = useState<{ id: string; nombres: string; apellidos: string }[]>([]);
  const [id, setId] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getStudents(1,800).then(r => { setStudents(r.items); setId(r.items[0]?.id ?? ""); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true); setError("");
    api.call<{ indicators: Record<string, unknown> }>(`/lms/students/${id}`).then(r => { if (active) setValues(r.indicators); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  return <section className="space-y-4"><h2 className="text-xl font-semibold">Seguimiento académico y LMS</h2>
    <label>Estudiante<select className={INPUT_CLASS} value={id} onChange={e => setId(e.target.value)}>{students.map(s => <option key={s.id} value={s.id}>{s.nombres} {s.apellidos}</option>)}</select></label>
    {error ? <p role="alert">{error}</p> : loading ? <p role="status">Cargando…</p> : !students.length ? <p>No hay estudiantes disponibles.</p> : <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(values).map(([key,value]) => <div key={key} className="premium-card p-4"><dt>{labels[key] ?? key}</dt><dd className="text-xl mt-2">{value === null ? "Sin registros" : typeof value === "number" ? value.toLocaleString("es-PE", { maximumFractionDigits: 2 }) : String(value)}</dd></div>)}</dl>}
  </section>;
}
