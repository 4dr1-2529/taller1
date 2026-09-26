"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { estudianteService } from "@/services/estudianteService";
import { useAuthReady } from "@/hooks/useAuthReady";
import { ESTUDIANTE_MSG } from "@/constants/estudiante";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatContributionPoints } from "@/lib/prediction-display";
import { ExperimentalBadge, ExperimentalNote } from "@/components/ui/ExperimentalBadge";

function riskLevelKey(nivel: string): "bajo" | "medio" | "alto" {
  const l = nivel.toLowerCase();
  if (l.includes("alto")) return "alto";
  if (l.includes("medio")) return "medio";
  return "bajo";
}

/** Traduce la etiqueta en español del estado a la clave interna del badge. */
function statusKey(estado: string): string {
  const l = estado.toLowerCase().trim();
  if (l.startsWith("nueva")) return "nueva";
  if (l.startsWith("en seguimiento")) return "en_seguimiento";
  if (l.startsWith("resuelt")) return "resuelta";
  return l.replace(/\s+/g, "_");
}

export function StudentPredictionView() {
  const { ready, isEstudiante } = useAuthReady();
  const [data, setData] = useState<Awaited<ReturnType<typeof estudianteService.getPrediccion>> | null>(null);
  const [alertas, setAlertas] = useState<Awaited<ReturnType<typeof estudianteService.getAlertas>> | null>(null);
  const [loading, setLoading] = useState(true);
  // ERROR de API ≠ resultado vacío: cada consulta lleva su propio indicador.
  const [predError, setPredError] = useState<string | null>(null);
  const [alertasError, setAlertasError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready || !isEstudiante) return;
    setPredError(null);
    setAlertasError(null);
    const [pred, al] = await Promise.allSettled([
      estudianteService.getPrediccion(),
      estudianteService.getAlertas(),
    ]);

    if (pred.status === "fulfilled") {
      setData(pred.value);
    } else {
      const reason = pred.reason;
      const msg = reason instanceof Error ? reason.message : "No se pudo consultar tu predicción.";
      toast.error(msg);
      setPredError(msg);
      setData(null);
    }

    if (al.status === "fulfilled") {
      setAlertas(al.value);
    } else {
      const reason = al.reason;
      const msg = reason instanceof Error ? reason.message : "No se pudieron consultar tus alertas.";
      toast.error(msg);
      setAlertasError(msg);
      setAlertas(null);
    }
  }, [ready, isEstudiante]);

  useEffect(() => {
    if (!ready || !isEstudiante) return;
    void load().finally(() => setLoading(false));
  }, [ready, isEstudiante, load]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const pred = data?.prediction;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Predicción de deserción"
        title="Mi riesgo de deserción"
        description={ESTUDIANTE_MSG.riesgo}
        badges={<ExperimentalBadge dataMode={pred?.dataMode} datasetVersion={pred?.datasetVersion} />}
      />

      {predError ? (
        <ErrorState
          message={predError}
          technicalDetail="GET /estudiante/prediccion"
          onRetry={() => void load()}
        />
      ) : !pred ? (
        <div className="premium-card rounded-xl p-6 text-center text-sm text-[var(--text-muted)]">
          {ESTUDIANTE_MSG.sinPrediccion}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="premium-card flex flex-col items-center rounded-xl p-6 lg:col-span-1">
            <RiskGauge score={pred.score} level={riskLevelKey(pred.nivel)} />
            <div className="mt-3">
              <RiskBadge level={riskLevelKey(pred.nivel)} score={pred.score} />
            </div>
          </div>

          <div className="premium-card space-y-3 rounded-xl p-5 lg:col-span-2 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[var(--text-muted)]">Score predictivo</p>
                <p className="text-lg font-bold">{pred.score}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Probabilidad de deserción</p>
                <p className="text-lg font-bold">{(pred.probabilidadAbandono * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Nivel de riesgo</p>
                <p className="font-semibold">{pred.nivelRiesgo}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[var(--text-muted)]">Fecha de última predicción</p>
                <p className="font-semibold">{new Date(pred.fecha).toLocaleString("es-PE")}</p>
              </div>
            </div>

            {/* Sección secundaria: datos técnicos, fuera del flujo principal. */}
            <details className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2">
              <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Detalles técnicos de la estimación
              </summary>
              <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-[var(--border-subtle)] pb-1.5">
                  <dt className="text-xs text-[var(--text-secondary)]">Modelo</dt>
                  <dd className="text-xs font-semibold text-[var(--text-primary)]">
                    {pred.modelo}
                    {pred.modeloVersion ? ` v${pred.modeloVersion}` : ""}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-[var(--border-subtle)] pb-1.5">
                  <dt className="text-xs text-[var(--text-secondary)]">Fecha de cálculo</dt>
                  <dd className="text-xs font-semibold text-[var(--text-primary)]">
                    {new Date(pred.fecha).toLocaleString("es-PE")}
                  </dd>
                </div>
              </dl>
            </details>

            {pred.factores.length > 0 ? (
              <div>
                <p className="mb-2 font-semibold text-[var(--text-primary)]">Señales observadas asociadas</p>
                <ul className="space-y-1 text-[var(--text-secondary)]">
                  {pred.factores.map((f) => (
                    <li key={f.key}>
                      <strong className="text-[var(--text-primary)]">{f.label}</strong> — contribución{" "}
                      {formatContributionPoints(f.contribution)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-lg bg-[var(--surface-muted)] p-3">
              <p className="font-semibold text-[var(--text-primary)]">Recomendación personalizada</p>
              <p className="mt-1 text-[var(--text-secondary)]">{pred.recomendacion}</p>
            </div>

            <ExperimentalNote
              dataMode={pred.dataMode}
              datasetVersion={pred.datasetVersion}
              modelVersion={pred.modeloVersion}
            />
          </div>
        </div>
      )}

      <div className="premium-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Mis alertas activas</h3>
        {alertasError ? (
          <ErrorState
            className="mt-3"
            message={alertasError}
            technicalDetail="GET /estudiante/alertas"
            onRetry={() => void load()}
          />
        ) : !alertas?.items.length ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">{ESTUDIANTE_MSG.sinAlertas}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {alertas.items.map((a) => (
              <li key={a.id} className="rounded-lg border border-[var(--border-subtle)] p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold">{a.titulo}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <RiskBadge level={riskLevelKey(a.nivelRiesgo)} />
                    <StatusBadge status={statusKey(a.estado)} label={a.estado} />
                  </span>
                </div>
                {a.recomendacion ? <p className="mt-1 text-[var(--text-secondary)]">{a.recomendacion}</p> : null}
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
