"use client";

import { motion } from "framer-motion";
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
  return (
    <motion.section
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-elevated)] backdrop-blur-xl",
        variant === "form" && "p-6 md:p-8",
        variant === "table" && "overflow-hidden",
        variant === "default" && "p-6 md:p-8",
        className,
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 opacity-50" />
      <div className="relative z-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            {Icon ? (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/10">
                <Icon className="h-5 w-5 text-violet-400" aria-hidden />
              </span>
            ) : null}
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)] md:text-xl">
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
