"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Database } from "lucide-react";
import { PageSection } from "@/components/ui/PageSection";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
};

export function ChartCard({
  title,
  description,
  children,
  action,
  className,
  isEmpty = false,
  emptyMessage = "No hay información suficiente para este período.",
}: ChartCardProps) {
  return (
    <PageSection title={title} description={description} action={action} className={clsx("chart-card", className)}>
      {isEmpty ? <ChartEmptyState message={emptyMessage} /> : children}
    </PageSection>
  );
}

export function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 px-5 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--brand-orange)]">
        <Database className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-3 max-w-sm text-sm text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}

type TooltipPayload = {
  name?: string;
  value?: string | number;
  color?: string;
  unit?: string;
};

type AcademicTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
};

export function AcademicTooltip({ active, payload, label }: AcademicTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm">
      {label != null ? <p className="mb-2 font-semibold text-[var(--text-primary)]">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`${entry.name ?? "dato"}-${index}`} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? "var(--accent)" }} />
              {entry.name ?? "Valor"}
            </span>
            <span className="font-semibold tabular-nums whitespace-nowrap text-[var(--text-primary)]">
              {entry.value ?? "Sin dato"}{entry.unit ?? ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
