"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { ReactNode } from "react";

type BentoCellProps = {
  children: ReactNode;
  className?: string;
  col?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  row?: 1 | 2 | 3 | 4;
  delay?: number;
  variant?: "default" | "hero" | "muted";
};

const colClass: Record<number, string> = {
  1: "col-span-12 md:col-span-1",
  2: "col-span-12 md:col-span-2",
  3: "col-span-12 md:col-span-3",
  4: "col-span-12 sm:col-span-6 md:col-span-4",
  5: "col-span-12 md:col-span-5",
  6: "col-span-12 md:col-span-6",
  7: "col-span-12 md:col-span-7",
  8: "col-span-12 lg:col-span-8",
  9: "col-span-12 md:col-span-9",
  10: "col-span-12 md:col-span-10",
  11: "col-span-12 md:col-span-11",
  12: "col-span-12",
};

const rowClass: Record<number, string> = {
  1: "min-h-[120px]",
  2: "min-h-[280px] lg:min-h-[320px]",
  3: "min-h-[360px]",
  4: "min-h-[420px]",
};

export function BentoCell({
  children,
  className,
  col = 12,
  row = 1,
  delay = 0,
  variant = "default",
}: BentoCellProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        colClass[col],
        rowClass[row],
        "bento-cell flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[var(--surface)]/80 backdrop-blur-xl",
        variant === "hero" && "bento-cell-hero border-white/[0.1]",
        variant === "muted" && "bg-white/[0.02]",
        className,
      )}
    >
      {children}
    </motion.article>
  );
}
