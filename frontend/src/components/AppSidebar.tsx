"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  CalendarCheck,
  ChevronLeft,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  Layers,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  MessageCircle,
  School,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthProvider";
import type { AppSection } from "@/data/navigation";
import { groupsForSections } from "@/data/sidebar-nav";

const ICONS: Record<AppSection, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  "Estructura académica": Layers,
  Alertas: AlertTriangle,
  "Seguimiento psicológico": HeartHandshake,
  Estudiantes: Users,
  Profesores: GraduationCap,
  Cursos: BookOpen,
  Matrículas: UserPlus,
  Notas: ClipboardList,
  Asistencia: CalendarCheck,
  "Datos académicos": School,
  "Actividad LMS": Activity,
  Predicción: Sparkles,
  "Modelos IA": Brain,
  Chat: MessageCircle,
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

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/40">
            <BarChart3 className="h-5 w-5 text-white" aria-hidden />
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">EduRisk AI</p>
              <p className="truncate text-[10px] text-slate-400">Deserción · LMS · Ensemble</p>
            </div>
          ) : null}
        </div>
        {!collapsed && alertCount > 0 ? (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/15 px-2.5 py-2 text-[11px] font-medium text-rose-200 ring-1 ring-rose-500/25">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {alertCount} alertas activas
          </p>
        ) : null}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-3">
        {groups.map((group, gi) => (
          <div key={group.id}>
            {gi > 0 ? <div className="sidebar-group-divider" aria-hidden /> : null}
            {!collapsed ? (
              <p className="mb-2 mt-1 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/70">
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {group.items.map((section) => {
                const Icon = ICONS[section];
                const isActive = section === activeSection;
                if (!Icon) return null;
                return (
                  <li key={section}>
                    <button
                      type="button"
                      title={collapsed ? section : undefined}
                      onClick={() => {
                        onSelect(section);
                        setMobileOpen(false);
                      }}
                      className={clsx(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                        isActive
                          ? "sidebar-nav-active bg-gradient-to-r from-indigo-500/25 to-cyan-500/15 font-semibold text-white ring-1 ring-indigo-400/40"
                          : "text-slate-400 hover:bg-white/8 hover:text-white hover:shadow-[0_0_12px_rgba(99,102,241,0.15)]",
                      )}
                    >
                      {isActive ? (
                        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-indigo-400 to-cyan-400" />
                      ) : null}
                      <Icon className={clsx("h-4 w-4 shrink-0", isActive && "text-indigo-300")} />
                      {!collapsed ? <span className="flex-1 truncate">{section}</span> : null}
                      {!collapsed && section === "Alertas" && alertCount > 0 ? (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {alertCount}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <ThemeToggle />
          {!collapsed && isAuthenticated ? (
            <button type="button" onClick={logout} className="btn-ghost text-slate-400 hover:text-white border-white/10">
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          ) : null}
        </div>
        {!collapsed && user ? (
          <div className="rounded-xl bg-white/5 p-2.5 ring-1 ring-white/5">
            <p className="truncate text-xs font-medium text-white">
              {user.nombres} {user.apellidos}
            </p>
            <p className="text-[10px] capitalize text-slate-500">{user.role}</p>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/90 text-white ring-1 ring-white/10 backdrop-blur lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="glass-sidebar fixed inset-y-0 left-0 z-50 w-72 text-slate-100 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <button
                type="button"
                className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <aside
        className={clsx(
          "glass-sidebar sticky top-0 hidden h-screen shrink-0 flex-col text-slate-100 transition-all duration-300 lg:flex",
          collapsed ? "w-[72px]" : "w-72",
        )}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-300 shadow-lg hover:text-white"
          aria-label={collapsed ? "Expandir" : "Colapsar"}
        >
          <ChevronLeft className={clsx("h-3.5 w-3.5 transition", collapsed && "rotate-180")} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
