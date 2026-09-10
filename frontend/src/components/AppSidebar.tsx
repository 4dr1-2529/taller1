"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  ClipboardList,
  GraduationCap,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  MessageCircle,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import type { AppSection } from "@/data/navigation";
import { groupsForSections } from "@/data/sidebar-nav";
import { getSectionLabel } from "@/data/section-labels";
import { getRoleLabel } from "@/lib/role-labels";
import { BlenkirLogo } from "@/components/branding/BlenkirLogo";

const ICONS: Record<AppSection, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Alertas: AlertTriangle,
  Estudiantes: Users,
  Profesores: GraduationCap,
  Asignaciones: UserPlus,
  Cursos: BookOpen,
  Matrículas: UserPlus,
  Notas: ClipboardList,
  Asistencia: CalendarCheck,
  "Actividad LMS": Activity,
  Predicción: Sparkles,
  "Historial predicciones": History,
  "Mensajería Académica": MessageCircle,
  Reportes: LineChart,
};

type AppSidebarProps = {
  sections: readonly AppSection[];
  activeSection: AppSection;
  onSelect: (section: AppSection) => void;
  alertCount: number;
};

export function AppSidebar({ sections, activeSection, onSelect, alertCount }: AppSidebarProps) {
  const reduced = useReducedMotion();
  const { user, logout, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = groupsForSections(sections);
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const trigger = triggerRef.current;
    const drawer = drawerRef.current;
    const main = document.querySelector<HTMLElement>(".app-main");
    const wasInert = main?.inert ?? false;
    if (main) main.inert = true;
    drawer?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setMobileOpen(false); }
      if (event.key !== "Tab" || !drawer) return;
      const targets = Array.from(drawer.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], [tabindex='0']")).filter(el => el.getClientRects().length);
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (main) main.inert = wasInert;
      trigger?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    const stored = localStorage.getItem("tesis-sidebar-collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("tesis-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  const getInitials = (nombres: string, apellidos: string) => {
    const first = nombres?.charAt(0)?.toUpperCase() ?? "";
    const last = apellidos?.charAt(0)?.toUpperCase() ?? "";
    return first + last;
  };

  const compact = collapsed && !mobileOpen;
  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand Section */}
      <div className="sidebar-brand relative border-b border-white/10">
        <div className={clsx(compact && "justify-center")}>
          <BlenkirLogo size="sm" showText={!compact} />
          {!compact ? (
            <p className="mt-2 text-xs font-medium text-[var(--sidebar-muted)]">
              Riesgo de deserción · LMS
            </p>
          ) : null}
        </div>

        {/* Alert Banner */}
        <AnimatePresence>
          {!compact && alertCount > 0 && (
            <motion.div
              className="mt-4 flex items-center gap-2.5 rounded-[var(--radius-md)] bg-rose-500/10 px-3 py-2.5 ring-1 ring-rose-300/20"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="relative">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              </div>
              <span className="text-[12px] font-semibold text-rose-100">
                {alertCount} alertas activas
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav flex-1 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-thin" aria-label="Navegación principal">
        {groups.map((group, gi) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: gi * 0.05 }}
          >
            {/* Group Label */}
            <AnimatePresence>
              {!compact && (
                <motion.div
                  className="mb-2.5 flex items-center gap-2 px-2.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="h-px flex-1 bg-white/10" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-orange)]/80">
                    {group.label}
                  </p>
                  <div className="h-px flex-1 bg-white/10" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nav Items */}
            <ul className="space-y-1">
              {group.items.map((section) => {
                const Icon = ICONS[section];
                const isActive = section === activeSection;
                if (!Icon) return null;
                return (
                  <li key={section}>
                    <motion.button
                      type="button"
                      title={compact ? getSectionLabel(section, user?.role) : undefined}
                      aria-label={getSectionLabel(section, user?.role)}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => {
                        onSelect(section);
                        setMobileOpen(false);
                      }}
                      whileHover={{ scale: compact ? 1 : 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className={clsx(
                        "group relative flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-[14px] font-medium transition-all duration-200",
                        isActive
                          ? "bg-white/[0.12] text-[var(--sidebar-text)] ring-1 ring-[var(--brand-orange)]/40 shadow-[inset_3px_0_0_0_var(--brand-orange)]"
                          : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]",
                        compact && "justify-center px-0",
                      )}
                    >
                      {/* Active Left Glow Bar */}
                      {isActive && (
                        <motion.span
                          className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--brand-orange)]"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.25, type: "spring" }}
                        />
                      )}

                      {/* Icon */}
                      <motion.div
                        className={clsx(
                            "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-all duration-200",
                          isActive
                            ? "bg-[var(--brand-orange)]/15 text-[var(--brand-orange)]"
                            : "bg-transparent text-[var(--sidebar-muted)] group-hover:text-[var(--sidebar-text)] group-hover:bg-[var(--sidebar-hover)]",
                        )}
                      >
                        <Icon className="h-[22px] w-[22px]" aria-hidden />
                      </motion.div>

                      {/* Label */}
                      <AnimatePresence>
                        {!compact && (
                          <motion.span
                            className="min-w-0 flex-1 whitespace-normal leading-snug"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            {getSectionLabel(section, user?.role)}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Alert Badge with Pulse */}
                      <AnimatePresence>
                        {!compact && section === "Alertas" && alertCount > 0 && (
                          <motion.div
                            className="relative"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ">
                              {alertCount > 9 ? "9+" : alertCount}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-profile space-y-3 border-t border-white/10">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sidebar-muted)] transition-all duration-200 hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
            aria-label={compact ? "Expandir" : "Colapsar"}
          >
            <motion.div
              animate={{ rotate: compact ? 180 : 0 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </button>
          {isAuthenticated && (
            <motion.button
              type="button"
              aria-label="Cerrar sesión"
              onClick={logout}
              whileHover={reduced ? undefined : { scale: 1.02 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[var(--sidebar-muted)] transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 hover:ring-1 hover:ring-rose-500/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              <AnimatePresence>
                {!compact && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Salir
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>

        {/* User Profile Card */}
        <AnimatePresence>
          {!compact && user && (
            <motion.div
              className="group relative overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-white/[0.06] p-3 transition-all duration-200 hover:border-white/20"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-orange)] text-[12px] font-bold text-white shadow-sm ring-1 ring-white/10">
                  {getInitials(user.nombres, user.apellidos)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[13px] font-semibold text-[var(--sidebar-text)]">
                    {user.nombres} {user.apellidos}
                  </p>
                  <p className="text-[11px] font-medium text-[var(--sidebar-muted)]">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        type="button"
        ref={triggerRef}
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
        className="sidebar-mobile-trigger fixed left-5 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-lg backdrop-blur-xl lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        whileHover={reduced ? undefined : { scale: 1.02 }}
        whileTap={reduced ? undefined : { scale: 0.98 }}
      >
        <Menu className="h-5 w-5" />
      </motion.button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-[#0a1729]/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              ref={drawerRef}
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Navegación principal"
              className="glass-sidebar-premium fixed inset-y-0 left-0 z-50 w-[min(320px,88vw)] text-[var(--sidebar-text)] lg:hidden"
              initial={reduced ? false : { x: -320 }}
              animate={{ x: 0 }}
              exit={reduced ? undefined : { x: -320 }}
              transition={{ duration: reduced ? 0 : 0.28, ease: "easeOut" }}
            >
              <button
                type="button"
                aria-label="Cerrar menú"
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-[var(--sidebar-muted)] transition-colors hover:bg-white/[0.06] hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        className="glass-sidebar-premium hidden h-screen shrink-0 flex-col text-[var(--sidebar-text)] transition-all duration-300 lg:flex"
        animate={{ width: compact ? "var(--sidebar-collapsed)" : "var(--sidebar-width)" }}
        transition={{ duration: reduced ? 0 : 0.28, ease: "easeOut" }}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
