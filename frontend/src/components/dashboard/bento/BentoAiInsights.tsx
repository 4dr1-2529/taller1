"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import type { AiInsight } from "@/lib/dashboard-data";

export function BentoAiInsights({ insights }: { insights: AiInsight[] }) {
  return (
    <div className="flex h-full flex-col p-5 md:p-6">
      <header className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/25">
          <Brain className="h-4 w-4 text-violet-300" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Insights IA</h3>
          <p className="text-xs text-[var(--text-secondary)]">Recomendaciones del ensemble</p>
        </div>
      </header>
      <ul className="mt-4 flex-1 space-y-3">
        {insights.map((ins, i) => (
          <motion.li
            key={ins.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  ins.priority === "alta"
                    ? "bg-rose-500/15 text-rose-300"
                    : "bg-white/5 text-[var(--text-muted)]"
                }`}
              >
                {ins.priority}
              </span>
              {ins.metric ? (
                <span className="text-xs font-bold tabular-nums text-violet-300">{ins.metric}</span>
              ) : null}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              {ins.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{ins.body}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
