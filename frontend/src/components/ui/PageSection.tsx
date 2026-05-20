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
        variant === "form" && "premium-card p-6 md:p-7",
        variant === "table" && "premium-card overflow-hidden",
        variant === "default" && "premium-card p-6 md:p-7",
        className,
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          {Icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 ring-1 ring-indigo-500/30">
              <Icon className="h-5 w-5 text-indigo-400" aria-hidden />
            </span>
          ) : null}
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)] md:text-lg">
              {title}
            </h3>
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </motion.section>
  );
}
