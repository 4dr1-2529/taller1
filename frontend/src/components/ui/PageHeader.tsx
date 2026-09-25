"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type PageHeaderProps = {
  /** Título del bloque. Se renderiza como h2 para no competir con el h1 del shell. */
  title: string;
  /** Descripción breve de una línea: qué hace el usuario en esta pantalla. */
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  /** Badges contextuales (experimental, estado de datos, conteos). */
  badges?: ReactNode;
  /** Acciones principales alineadas a la derecha en desktop. */
  actions?: ReactNode;
  /** Contenido adicional bajo la descripción (contexto, chips, enlaces). */
  extra?: ReactNode;
  className?: string;
};

/**
 * Cabecera estándar de vista: eyebrow → título → descripción → badges → acciones.
 * Evita que cada pantalla reinvente su propio encabezado con márgenes distintos.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  badges,
  actions,
  extra,
  className,
}: PageHeaderProps) {
  return (
    <header className={clsx("flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="intelligence-eyebrow mb-2">{eyebrow}</p>
        ) : null}
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-muted)] ring-1 ring-[var(--brand-orange)]/25">
              <Icon className="h-5 w-5 text-[var(--brand-orange)]" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-section-title font-semibold text-[var(--text-primary)]">{title}</h2>
            {description ? (
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
                {description}
              </p>
            ) : null}
            {badges ? <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div> : null}
            {extra ? <div className="mt-3">{extra}</div> : null}
          </div>
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
