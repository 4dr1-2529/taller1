"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthProvider";
import type { AppSection } from "@/data/navigation";
import { SECTION_BREADCRUMB } from "@/data/sidebar-nav";
import { getSectionLabel } from "@/data/section-labels";
import { getRoleLabel } from "@/lib/role-labels";

type AppHeaderProps = {
  activeSection: AppSection;
  subtitle: string;
};

export function AppHeader({ activeSection, subtitle }: AppHeaderProps) {
  const { user } = useAuth();
  const [now, setNow] = useState("");
  const crumbs = SECTION_BREADCRUMB[activeSection] ?? [activeSection];

  useEffect(() => {
    const tick = () => {
      setNow(
        new Date().toLocaleString("es-PE", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const initials = user
    ? `${user.nombres.charAt(0)}${user.apellidos.charAt(0)}`.toUpperCase()
    : "?";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-header relative overflow-hidden rounded-2xl px-5 py-5 md:px-8 md:py-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.06),transparent_50%)]" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px]">
            {crumbs.map((c, i) => (
              <span key={c} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-[var(--text-muted)]/50" />}
                <span
                  className={`transition-colors duration-200 ${
                    i === crumbs.length - 1
                      ? "font-semibold text-violet-400"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {c}
                </span>
              </span>
            ))}
          </nav>

          <motion.h1
            layout
            className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl"
          >
            {getSectionLabel(activeSection, user?.role)}
          </motion.h1>

          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)] md:text-base">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <span className="hidden text-[13px] text-[var(--text-muted)] lg:inline">{now}</span>
          <ThemeToggle />
          <NotificationBell />

          {user ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--accent-muted)] p-1.5 pr-4 transition-all duration-200 hover:border-violet-500/30"
            >
              <div className="relative">
                <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 opacity-70 blur-[2px]" />
                <span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 text-[15px] font-bold text-white shadow-lg shadow-violet-500/25">
                  {initials}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-semibold leading-tight text-[var(--text-primary)]">
                  {user.nombres} {user.apellidos}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">{getRoleLabel(user.role)}</p>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.header>
  );
}
