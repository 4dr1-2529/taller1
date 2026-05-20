"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Clock } from "lucide-react";
import type { TimelineEvent } from "@/lib/dashboard-data";

const toneDot: Record<TimelineEvent["tone"], string> = {
  danger: "bg-rose-500 ring-rose-500/30",
  warning: "bg-amber-500 ring-amber-500/30",
  info: "bg-violet-500 ring-violet-500/30",
  success: "bg-emerald-500 ring-emerald-500/30",
};

export function BentoTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="flex h-full flex-col p-5 md:p-6">
      <header className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-[var(--text-muted)]" />
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Timeline operativo</h3>
      </header>
      <ol className="relative mt-5 flex-1 space-y-0 border-l border-white/10 pl-4">
        {events.map((ev, i) => (
          <motion.li
            key={ev.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative pb-5 last:pb-0"
          >
            <span
              className={clsx(
                "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--surface)]",
                toneDot[ev.tone],
              )}
            />
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{ev.time}</p>
            <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">{ev.title}</p>
            <p className="text-xs text-[var(--text-secondary)]">{ev.detail}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
