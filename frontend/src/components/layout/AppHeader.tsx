"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  const reduced = useReducedMotion();
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
      initial={reduced ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.25 }}
      className="app-header glass-header rounded-[var(--radius-lg)]">
      <div className="app-header__top">
        <nav aria-label="Ruta de la página" className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
          {crumbs.map((c, i) => <span key={c} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            <span className={i === crumbs.length - 1 ? "font-semibold text-[var(--accent)]" : ""}>{c}</span>
          </span>)}
        </nav>
        <div className="app-header__controls">
          <span className="app-header__date">{now}</span>
          <ThemeToggle /><NotificationBell />
          {user ? <div className="app-header__profile">
            <span className="app-header__avatar">{initials}</span>
            <div className="hidden min-w-0 sm:block">
              <p className="max-w-44 truncate text-sm font-semibold" title={`${user.nombres} ${user.apellidos}`}>{user.nombres} {user.apellidos}</p>
              <p className="text-xs text-[var(--text-muted)]">{getRoleLabel(user.role)}</p>
            </div>
          </div> : null}
        </div>
      </div>
      <div className="app-header__title">
        <h1 className="text-page-title font-semibold text-[var(--text-primary)]">{getSectionLabel(activeSection, user?.role)}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    </motion.header>
  );
}
