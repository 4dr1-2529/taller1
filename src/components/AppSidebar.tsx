"use client";

import clsx from "clsx";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  School,
  Sparkles,
  UserPlus,
  Users,
  Brain,
  LogOut,
  MessageCircle,
  HeartHandshake,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthProvider";
import type { AppSection } from "@/data/seed";

const ICONS: Record<AppSection, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard,
  Alertas: AlertTriangle,
  "Seguimiento psicológico": HeartHandshake,
  Estudiantes: Users,
  Profesores: GraduationCap,
  Cursos: BookOpen,
  Matrículas: UserPlus,
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

export function AppSidebar({
  sections,
  activeSection,
  onSelect,
  alertCount,
}: AppSidebarProps) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <aside className="w-full border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 lg:min-h-screen lg:w-72">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30">
            <BarChart3 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-base font-bold leading-tight">Panel académico inteligente</h1>
            <p className="mt-1 text-xs text-slate-400">
              Ensemble learning · Riesgo de deserción · LMS
            </p>
          </div>
        </div>
        {alertCount > 0 ? (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/15 px-3 py-2 text-xs font-medium text-rose-100 ring-1 ring-rose-400/25">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {alertCount} estudiantes en alerta temprana
          </p>
        ) : (
          <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 ring-1 ring-emerald-400/20">
            Sin alertas críticas pendientes
          </p>
        )}
      </div>

      <nav className="space-y-1 p-3">
        {sections.map((section) => {
          const isActive = section === activeSection;
          const Icon = ICONS[section];
          return (
            <button
              key={section}
              type="button"
              onClick={() => onSelect(section)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                isActive
                  ? "bg-white/10 font-semibold text-white shadow-sm ring-1 ring-white/10"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="flex-1">{section}</span>
              {section === "Alertas" && alertCount > 0 ? (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {alertCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          {isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          ) : (
            <Link href="/login" className="text-xs text-indigo-300 hover:text-white">
              Iniciar sesión
            </Link>
          )}
        </div>
        {user ? (
          <p className="text-xs text-slate-400">
            {user.nombres} · <span className="capitalize">{user.role}</span>
          </p>
        ) : null}
        <p className="text-[11px] text-slate-500">I.E.P. Blenkir Huancayo · Perú</p>
      </div>
    </aside>
  );
}
