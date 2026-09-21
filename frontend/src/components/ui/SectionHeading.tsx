"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

type SectionHeadingProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  id?: string;
};

/** Encabezado de sección estándar: un solo estilo h2 en todas las vistas. */
export function SectionHeading({ title, description, icon, action, id }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)]/10 text-[var(--accent)]" aria-hidden>
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 id={id} className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className={clsx("flex shrink-0 items-center gap-2")}>{action}</div> : null}
    </div>
  );
}
