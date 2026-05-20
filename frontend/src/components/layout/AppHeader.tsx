"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Cpu, Search, Server, Sparkles, Wifi } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthProvider";
import type { AppSection } from "@/data/navigation";
import { SECTION_BREADCRUMB } from "@/data/sidebar-nav";

type AppHeaderProps = {
  activeSection: AppSection;
  subtitle: string;
  onSearch?: (query: string) => void;
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  docente: "Docente",
  tutor: "Tutor",
  psicologo: "Psicólogo",
  estudiante: "Estudiante",
  apoderado: "Apoderado",
};

export function AppHeader({ activeSection, subtitle, onSearch }: AppHeaderProps) {
  const { user } = useAuth();
  const [now, setNow] = useState("");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
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
            {activeSection}
          </motion.h1>

          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)] md:text-base">
            {subtitle}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
              <Server className="h-3 w-3" /> API operativa
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
              <Cpu className="h-3 w-3" /> Ensemble ML
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="relative hidden sm:block">
            <div
              className={`pointer-events-none absolute -inset-0.5 rounded-xl bg-gradient-to-r from-violet-500/20 to-cyan-500/20 opacity-0 blur transition-opacity duration-300 ${
                searchFocused ? "opacity-100" : ""
              }`}
            />
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] transition-colors duration-200" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  onSearch?.(e.target.value);
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Buscar en el panel…"
                className="h-10 w-[220px] rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60 backdrop-blur-sm transition-all duration-200 focus:border-violet-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-violet-500/10 md:w-[280px]"
              />
            </div>
          </div>

          <motion.div
            className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3.5 py-2 text-[13px] font-medium text-emerald-400 backdrop-blur-sm md:inline-flex"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <Sparkles className="h-3.5 w-3.5" />
            <span>IA activa</span>
          </motion.div>

          <div className="hidden items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[13px] text-[var(--text-muted)] backdrop-blur-sm lg:flex">
            <Wifi className="h-3 w-3 text-emerald-400/70" />
            <span>{now}</span>
          </div>

          <ThemeToggle />
          <NotificationBell />

          {user ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5 pr-4 backdrop-blur-sm transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06]"
            >
              <div className="relative">
                <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 opacity-70 blur-[2px]" />
                <span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 text-[15px] font-bold text-white shadow-lg shadow-violet-500/25">
                  {initials}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
                  {user.nombres} {user.apellidos}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {ROLE_LABEL[user.role] ?? user.role}
                </p>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.header>
  );
}
