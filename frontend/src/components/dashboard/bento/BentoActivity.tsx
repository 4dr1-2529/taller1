"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Radio } from "lucide-react";
import type { ActivityItem } from "@/lib/dashboard-data";

const toneRing: Record<ActivityItem["tone"], string> = {
  rose: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  violet: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
  cyan: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/25",
  emerald: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
};

export function BentoActivity({ items }: { items: ActivityItem[] }) {
  return (
    <div className="flex h-full flex-col p-5 md:p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-emerald-400" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Actividad en vivo</h3>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Actualizando
        </span>
      </header>
      <ul className="mt-4 flex-1 space-y-2 overflow-y-auto">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3"
          >
            <span className={clsx("mt-0.5 h-2 w-2 shrink-0 rounded-full ring-2", toneRing[item.tone])} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                <span className="shrink-0 text-[10px] text-[var(--text-muted)]">{item.timestamp}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{item.detail}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
