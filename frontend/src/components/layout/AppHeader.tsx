"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Search, Sparkles } from "lucide-react";
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
    <header className="glass-header rounded-2xl px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
            {crumbs.map((c, i) => (
              <span key={c} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="h-3 w-3 opacity-50" /> : null}
                <span className={i === crumbs.length - 1 ? "text-[var(--accent)] font-medium" : ""}>
                  {c}
                </span>
              </span>
            ))}
          </nav>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] md:text-2xl">
            {activeSection}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="relative hidden flex-1 sm:block sm:min-w-[200px] md:min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                onSearch?.(e.target.value);
              }}
              placeholder="Buscar en el panel…"
              className="input-premium pl-9"
            />
          </div>

          <motion.span
            className="ai-status-pulse hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 md:inline-flex"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <Sparkles className="h-3.5 w-3.5" />
            IA activa
          </motion.span>

          <span className="hidden text-xs text-[var(--text-muted)] lg:inline">{now}</span>

          <ThemeToggle />
          <NotificationBell />

          {user ? (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--accent-muted)] px-2 py-1.5 pl-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
                {initials}
              </span>
              <div className="hidden pr-2 sm:block">
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                  {user.nombres} {user.apellidos}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {ROLE_LABEL[user.role] ?? user.role}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
