"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { estudianteService } from "@/services/estudianteService";
import { useAuthReady } from "@/hooks/useAuthReady";
import { ESTUDIANTE_MSG } from "@/constants/estudiante";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { CardSkeleton } from "@/components/ui/Skeleton";

function riskLevelKey(nivel: string): "bajo" | "medio" | "alto" {
  const l = nivel.toLowerCase();
  if (l.includes("alto")) return "alto";
  if (l.includes("medio")) return "medio";
  return "bajo";
}

export function StudentPredictionView() {
  const { ready, isEstudiante } = useAuthReady();
  const [data, setData] = useState<Awaited<ReturnType<typeof estudianteService.getPrediccion>> | null>(null);
  const [alertas, setAlertas] = useState<Awaited<ReturnType<typeof estudianteService.getAlertas>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!ready || !isEstudiante) return;
    const [pred, al] = await Promise.all([
      estudianteService.getPrediccion().catch(() => null),
      estudianteService.getAlertas().catch(() => null),
    ]);
    setData(pred);
    setAlertas(al);
  }

  useEffect(() => {
    if (!ready || !isEstudiante) return;
    void load().finally(() => setLoading(false));
  }, [ready, isEstudiante]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await estudianteService.refreshPrediccion();
      await load();
      toast.success("Predicción actualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar la predicción");
    } finally {
      setRefreshing(false);
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-secondary)]">{ESTUDIANTE_MSG.riesgo}</p>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
          disabled={refreshing}
          onClick={() => void handleRefresh()}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar mi predicción
        </button>
      </div>

      {!pred ? (
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
                <p className="text-[var(--text-muted)]">Probabilidad de abandono</p>
                <p className="text-lg font-bold">{(pred.probabilidadAbandono * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Nivel de riesgo</p>
                <p className="font-semibold">{pred.nivelRiesgo}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Modelo usado</p>
                <p className="font-semibold">
                  {pred.modelo}
                  {pred.modeloVersion ? ` v${pred.modeloVersion}` : ""}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[var(--text-muted)]">Fecha de última predicción</p>
                <p className="font-semibold">{new Date(pred.fecha).toLocaleString("es-PE")}</p>
              </div>
            </div>

            {pred.factores.length > 0 ? (
              <div>
                <p className="mb-2 font-semibold text-[var(--text-primary)]">Factores principales</p>
                <ul className="space-y-1 text-[var(--text-secondary)]">
                  {pred.factores.map((f) => (
                    <li key={f.key}>
                      <strong className="text-[var(--text-primary)]">{f.label}</strong> — contribución{" "}
                      {(f.contribution * 100).toFixed(0)}%
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-lg bg-[var(--surface-muted)] p-3">
              <p className="font-semibold text-[var(--text-primary)]">Recomendación personalizada</p>
              <p className="mt-1 text-[var(--text-secondary)]">{pred.recomendacion}</p>
            </div>
          </div>
        </div>
      )}

      <div className="premium-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Mis alertas activas</h3>
        {!alertas?.items.length ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">{ESTUDIANTE_MSG.sinAlertas}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {alertas.items.map((a) => (
              <li key={a.id} className="rounded-lg border border-[var(--border-subtle)] p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold">{a.titulo}</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {a.nivelRiesgo} · {a.estado}
                  </span>
                </div>
                {a.recomendacion ? <p className="mt-1 text-[var(--text-secondary)]">{a.recomendacion}</p> : null}
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
