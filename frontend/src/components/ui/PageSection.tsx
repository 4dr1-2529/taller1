"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";

type PageSectionProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  variant?: "default" | "form" | "table";
};

export function PageSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  action,
  variant = "default",
}: PageSectionProps) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      className={clsx(
        "page-section relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--card-shadow)] backdrop-blur-xl",
        variant === "form" && "p-5 sm:p-6 xl:p-8",
        variant === "table" && "page-section--table overflow-hidden",
        variant === "default" && "p-6 md:p-8",
        className,
      )}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative z-10">
        <div className="page-section__header mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            {Icon ? (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-muted)] ring-1 ring-[var(--brand-orange)]/25">
                <Icon className="h-5 w-5 text-[var(--brand-orange)]" aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0">
              <h3 className="text-section-title font-semibold text-[var(--text-primary)]">
                {title}
              </h3>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </div>
    </motion.section>
  );
}
