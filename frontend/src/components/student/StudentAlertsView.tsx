"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { estudianteService } from "@/services/estudianteService";
import { useAuthReady } from "@/hooks/useAuthReady";
import { ESTUDIANTE_MSG } from "@/constants/estudiante";
import { PageHeader } from "@/components/ui/PageHeader";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/EmptyState";

type AlertasResponse = Awaited<ReturnType<typeof estudianteService.getAlertas>>;
type AlertaItem = AlertasResponse["items"][number];

/** Traduce el nivel en español a la clave interna del badge. */
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

function formatDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Mis alertas (estudiante): consulta GET /estudiante/alertas y muestra el
 * resultado en SOLO LECTURA. El estudiante nunca cambia estados — eso lo hacen
 * el profesor y el director desde sus propias vistas.
 */
export function StudentAlertsView() {
  const { ready, isEstudiante } = useAuthReady();
  const [data, setData] = useState<AlertasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready || !isEstudiante) return;
    setLoading(true);
    setError(null);
    try {
      const res = await estudianteService.getAlertas();
      setData(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudieron cargar tus alertas.";
      toast.error(msg);
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [ready, isEstudiante]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Seguimiento personal"
        title="Mis alertas"
        description="Alertas tempranas generadas para tu perfil. Aquí solo se consultan: el estado lo gestionan tus profesores y la dirección."
        icon={BellRing}
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState message={error} technicalDetail="GET /estudiante/alertas" onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="Sin alertas"
          description={ESTUDIANTE_MSG.sinAlertas}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((a: AlertaItem) => (
            <li key={a.id} className="premium-card rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[var(--text-primary)]">{a.titulo}</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{formatDate(a.fecha)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RiskBadge level={riskLevelKey(a.nivelRiesgo)} score={a.score ?? undefined} />
                  <StatusBadge status={statusKey(a.estado)} label={a.estado} />
                </div>
              </div>

              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {a.score != null && Number.isFinite(a.score) ? (
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">Puntaje</dt>
                    <dd className="text-sm font-semibold text-[var(--text-primary)]">{a.score}</dd>
                  </div>
                ) : null}
                {a.probabilidad != null && Number.isFinite(a.probabilidad) ? (
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">Probabilidad estimada</dt>
                    <dd className="text-sm font-semibold text-[var(--text-primary)]">
                      {(a.probabilidad * 100).toFixed(1)}%
                    </dd>
                  </div>
                ) : null}
              </dl>

              {a.recomendacion ? (
                <div className="mt-3 rounded-lg bg-[var(--surface-muted)] p-3 text-sm">
                  <span className="font-semibold text-[var(--text-primary)]">Recomendación: </span>
                  <span className="text-[var(--text-secondary)]">{a.recomendacion}</span>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
