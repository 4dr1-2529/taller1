"use client";

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
import { CardSkeleton } from "@/components/ui/Skeleton";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { RiskGauge } from "@/components/ui/RiskGauge";

function KpiCard({
  label,
  value,
  suffix = "",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: typeof BookOpen;
}) {
  return (
    <div className="premium-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
        <Icon className="h-4 w-4 text-[var(--brand-orange)]" />
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
        {value}
        {suffix}
      </p>
    </div>
  );
}

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
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
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-secondary)]">
        Bienvenido, {profile.nombres}. Aquí tienes un resumen de tu situación académica.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Mi grado" value={kpis.grado} icon={GraduationCap} />
        <KpiCard label="Mi sección" value={kpis.salon} icon={Layers} />
        <KpiCard label="Mi promedio" value={kpis.promedioGeneral} suffix="/20" icon={BookOpen} />
        <KpiCard label="Mi asistencia" value={kpis.asistenciaGeneral} suffix="%" icon={TrendingUp} />
        <KpiCard label="Mi nivel de riesgo" value={kpis.nivelRiesgo} icon={Sparkles} />
        <KpiCard label="Mis alertas activas" value={kpis.alertasActivas} icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="premium-card flex flex-col items-center justify-center rounded-xl p-6 lg:col-span-1">
          <p className="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Mi riesgo actual</p>
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

        <div className="premium-card rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Resumen reciente</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
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
          {resumen.recomendacion ? (
            <div className="mt-4 rounded-lg bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">Recomendación:</strong> {resumen.recomendacion}
            </div>
          ) : null}
        </div>
      </div>

      <div className="premium-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Mis alertas</h3>
        {alertasPreview.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">{ESTUDIANTE_MSG.sinAlertas}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {alertasPreview.map((a) => (
              <li key={a.id} className="rounded-lg border border-[var(--border-subtle)] p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{a.titulo}</span>
                  <span className="text-xs text-[var(--text-muted)]">{a.nivel} · {a.estado}</span>
                </div>
                {a.recomendacion ? (
                  <p className="mt-1 text-[var(--text-secondary)]">{a.recomendacion}</p>
                ) : null}
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
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
