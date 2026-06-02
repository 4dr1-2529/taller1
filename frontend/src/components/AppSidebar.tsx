"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  ClipboardList,
  Eye,
  GraduationCap,
  History,
  HeartHandshake,
  Layers,
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

const ICONS: Record<AppSection, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Alertas: AlertTriangle,
  Estudiantes: Users,
  Profesores: GraduationCap,
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
  const { user, logout, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = groupsForSections(sections);

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

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand Section */}
      <div className="relative border-b border-[var(--border-subtle)] px-5 py-5">
        <div className="flex items-center gap-3.5">
          <motion.div
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            aria-label="Panel institucional I.E.P. Huancayo"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-500 to-cyan-400" />
            <BarChart3 className="relative h-5 w-5 text-white drop-shadow-lg" aria-hidden />
          </motion.div>

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                className="min-w-0"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="truncate text-[15px] font-bold tracking-tight text-[var(--sidebar-text)]">
                  I.E.P. Huancayo
                </p>
                <p className="truncate text-[11px] font-medium text-[var(--sidebar-muted)]">
                  Riesgo de deserción · LMS
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Alert Banner */}
        <AnimatePresence>
          {!collapsed && alertCount > 0 && (
            <motion.div
              className="mt-4 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-500/10 to-orange-500/5 px-3 py-2.5 ring-1 ring-rose-500/20"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="relative">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-rose-400/30"
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="text-[12px] font-semibold text-rose-200">
                {alertCount} alertas activas
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin">
        {groups.map((group, gi) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: gi * 0.05 }}
          >
            {/* Group Label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  className="mb-2.5 flex items-center gap-2 px-2.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-violet-500/30 via-purple-500/20 to-transparent" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400/60">
                    {group.label}
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-l from-violet-500/30 via-purple-500/20 to-transparent" />
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
                      title={collapsed ? getSectionLabel(section) : undefined}
                      onClick={() => {
                        onSelect(section);
                        setMobileOpen(false);
                      }}
                      whileHover={{ scale: collapsed ? 1 : 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className={clsx(
                        "group relative flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-[14px] font-medium transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-transparent text-[var(--sidebar-text)] ring-1 ring-cyan-500/25 shadow-[0_0_16px_rgba(34,211,238,0.08)]"
                          : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      {/* Active Left Glow Bar */}
                      {isActive && (
                        <motion.span
                          className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-teal-400"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.25, type: "spring" }}
                          style={{
                            boxShadow: "0 0 12px rgba(139,92,246,0.5), 0 0 24px rgba(139,92,246,0.25)",
                          }}
                        />
                      )}

                      {/* Icon */}
                      <motion.div
                        className={clsx(
                          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                          isActive
                            ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300"
                            : "bg-transparent text-[var(--sidebar-muted)] group-hover:text-[var(--sidebar-text)] group-hover:bg-[var(--sidebar-hover)]",
                        )}
                      >
                        <Icon className="h-[22px] w-[22px]" aria-hidden />
                      </motion.div>

                      {/* Label */}
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            className="flex-1 truncate"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            {getSectionLabel(section)}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Alert Badge with Pulse */}
                      <AnimatePresence>
                        {!collapsed && section === "Alertas" && alertCount > 0 && (
                          <motion.div
                            className="relative"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <motion.div
                              className="absolute inset-0 rounded-full bg-rose-500/40"
                              animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30">
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
      <div className="border-t border-[var(--border-subtle)] px-3 py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sidebar-muted)] transition-all duration-200 hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
            aria-label={collapsed ? "Expandir" : "Colapsar"}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </button>
          {isAuthenticated && (
            <motion.button
              type="button"
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[var(--sidebar-muted)] transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 hover:ring-1 hover:ring-rose-500/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              <AnimatePresence>
                {!collapsed && (
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
          {!collapsed && user && (
            <motion.div
              className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-hover)] p-3 transition-all duration-200 hover:border-violet-500/25"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-[12px] font-bold text-white shadow-lg shadow-violet-500/20 ring-1 ring-white/10">
                  {getInitials(user.nombres, user.apellidos)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[var(--sidebar-text)]">
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
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-lg backdrop-blur-xl lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Menu className="h-5 w-5" />
      </motion.button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="glass-sidebar-premium fixed inset-y-0 left-0 z-50 w-[280px] text-[var(--sidebar-text)] lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
            >
              <button
                type="button"
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
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
        className="glass-sidebar-premium sticky top-0 z-30 hidden h-screen shrink-0 flex-col text-[var(--sidebar-text)] transition-all duration-300 lg:flex"
        animate={{ width: collapsed ? 88 : 320 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
