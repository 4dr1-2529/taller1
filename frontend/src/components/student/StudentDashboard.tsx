"use client";

import { DashboardMetricCard as KpiCard } from "@/components/dashboard/DashboardMetricCard";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { estudianteService, type EstudianteDashboardData } from "@/services/estudianteService";
import { useAuthReady } from "@/hooks/useAuthReady";
import { ESTUDIANTE_MSG } from "@/constants/estudiante";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { MiniProgressBar } from "@/components/ui/MiniProgressBar";
import { RiskGauge } from "@/components/ui/RiskGauge";


function riskLevelKey(label: string): "bajo" | "medio" | "alto" {
  const l = label.toLowerCase();
  if (l.includes("alto")) return "alto";
  if (l.includes("medio")) return "medio";
  return "bajo";
}

export function StudentDashboard() {
  const { ready, isEstudiante } = useAuthReady();
  const [data, setData] = useState<EstudianteDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !isEstudiante) return;
    setLoading(true);
    void estudianteService
      .getDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ready, isEstudiante]);

  if (loading) {
    return (
      <DashboardSkeleton />
    );
  }

  if (!data?.profile) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        No se pudo cargar tu perfil. Verifique que su cuenta esté vinculada a un estudiante activo.
      </p>
    );
  }

  const { profile, kpis, resumen, alertasPreview } = data;
  const riskLevel = resumen.ultimaPrediccion
    ? riskLevelKey(resumen.ultimaPrediccion.nivel)
    : riskLevelKey(kpis.nivelRiesgo);
  const riskScore = resumen.ultimaPrediccion?.score ?? 0;

  return (
    <div className="student-dashboard space-y-6">
      <div className="student-welcome rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6 sm:p-8">
        <p className="text-page-title font-semibold text-[var(--text-primary)]">Mi progreso académico</p>
        <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
        Bienvenido, {profile.nombres}. Aquí tienes un resumen de tu situación académica.
        </p>
      </div>

      <div className="metric-band student-metrics">
        <KpiCard label="Mi grado" value={kpis.grado} icon={GraduationCap} index={0} />
        <KpiCard label="Mi sección" value={kpis.salon} icon={Layers} index={1} />
        <KpiCard label="Mi promedio" value={kpis.promedioGeneral} suffix="/20" icon={BookOpen} index={2} />
        <KpiCard label="Mi asistencia" value={kpis.asistenciaGeneral} suffix="%" icon={TrendingUp} index={3} />
      </div>
      <div className="student-status-line metric-band">
        <KpiCard label="Mi nivel de riesgo" value={kpis.nivelRiesgo} icon={Sparkles} />
        <KpiCard label="Mis alertas activas" value={kpis.alertasActivas} icon={AlertTriangle} />
      </div>

      <div className="student-progress-layout">
        <div className="student-risk-panel">
          <p className="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Mi nivel de riesgo</p>
          {resumen.ultimaPrediccion ? (
            <>
              <RiskGauge score={riskScore} level={riskLevel} />
              <div className="mt-3">
                <RiskBadge level={riskLevel} score={riskScore} />
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">{ESTUDIANTE_MSG.sinPrediccion}</p>
          )}
        </div>

        <div className="student-activity-panel">
          <h3 className="text-section-title font-semibold text-[var(--text-primary)]">Mi actividad reciente</h3>
          <dl className="learning-timeline">
            <div>
              <dt className="text-[var(--text-muted)]">Última nota</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {resumen.ultimaNota
                  ? `${resumen.ultimaNota.curso}: ${resumen.ultimaNota.nota} (B${resumen.ultimaNota.bimestre})`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Última asistencia</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {resumen.ultimaAsistencia
                  ? `${new Date(resumen.ultimaAsistencia.fecha).toLocaleDateString("es-PE")} — ${resumen.ultimaAsistencia.estado}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Última actividad LMS</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {resumen.ultimaActividadLms
                  ? `Sem. ${resumen.ultimaActividadLms.semana} — ${resumen.ultimaActividadLms.actividadPct}%`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Última predicción</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {resumen.ultimaPrediccion
                  ? `${resumen.ultimaPrediccion.nivel} (${resumen.ultimaPrediccion.score})`
                  : "Sin datos"}
              </dd>
            </div>
          </dl>
          {resumen.ultimaActividadLms ? <div className="learning-progress"><span>Actividad LMS · Semana {resumen.ultimaActividadLms.semana}</span><MiniProgressBar value={resumen.ultimaActividadLms.actividadPct} variant="cyan" /></div> : null}
          {resumen.recomendacion ? (
            <div className="surface-subtle mt-5 rounded-[var(--radius-md)] p-4 text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">Recomendación:</strong> {resumen.recomendacion}
            </div>
          ) : null}
        </div>
      </div>

      <div className="student-notices">
        <h3 className="text-section-title font-semibold text-[var(--text-primary)]">Mis alertas</h3>
        {alertasPreview.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">{ESTUDIANTE_MSG.sinAlertas}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {alertasPreview.map((a) => (
              <li key={a.id} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{a.titulo}</span>
                  <span className="text-xs text-[var(--text-muted)]">{a.nivel} · {a.estado}</span>
                </div>
                {a.recomendacion ? (
                  <p className="mt-1 text-[var(--text-secondary)]">{a.recomendacion}</p>
                ) : null}
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {new Date(a.fecha).toLocaleString("es-PE")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
