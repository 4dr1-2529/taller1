"use client";

import { CircleCheck, CircleDot, Eye, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export type AlertStatus = "nueva" | "en_seguimiento" | "resuelta";

/** Estado + tono + icono + etiqueta en un solo lugar. */
const STATUS: Record<string, { label: string; tone: string; icon: LucideIcon; hint: string }> = {
  nueva: {
    label: "Nueva",
    tone: "badge-danger",
    icon: Sparkles,
    hint: "Sin atención iniciada",
  },
  en_seguimiento: {
    label: "En seguimiento",
    tone: "badge-warning",
    icon: Eye,
    hint: "Acción en curso",
  },
  resuelta: {
    label: "Resuelta",
    tone: "badge-success",
    icon: CircleCheck,
    hint: "Cerrada por el equipo",
  },
  abierta: {
    label: "Abierta",
    tone: "badge-danger",
    icon: CircleDot,
    hint: "Requiere atención",
  },
};

type StatusBadgeProps = {
  status: string;
  /** Etiqueta sobrescrita (p. ej. texto crudo que devuelve la API). */
  label?: string;
  className?: string;
};

/**
 * Insignia de estado que nunca comunica solo por color: siempre lleva icono
 * y texto, y expone el significado vía `title`.
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const cfg = STATUS[status] ?? {
    label: label ?? status,
    tone: "badge-info",
    icon: CircleDot,
    hint: "",
  };
  const Icon = cfg.icon;
  return (
    <span
      className={clsx("badge inline-flex items-center gap-1.5 whitespace-nowrap", cfg.tone, className)}
      title={cfg.hint || undefined}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label ?? cfg.label}
    </span>
  );
}
