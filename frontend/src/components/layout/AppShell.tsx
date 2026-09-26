"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { PageTransition } from "@/components/ui/PageTransition";
import type { AppSection } from "@/data/navigation";
import type { DataSource } from "@/hooks/useAcademicData";

type AppShellProps = {
  sections: readonly AppSection[];
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  alertCount: number;
  subtitle: string;
  dataSource: DataSource;
  loading: boolean;
  onRefresh: () => void;
  children: ReactNode;
};

export function AppShell({
  sections,
  activeSection,
  onSelectSection,
  alertCount,
  subtitle,
  dataSource,
  loading,
  onRefresh,
  children,
}: AppShellProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="app-bg relative flex h-screen overflow-hidden"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
    >
      <div className="app-orb app-orb-violet" aria-hidden />
      <div className="app-orb app-orb-cyan" aria-hidden />

      {/* Accesibilidad: primer enlace de la página para saltar la navegación. */}
      <a
        href="#app-main"
        className="sr-only rounded-lg bg-[var(--brand-navy)] px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--brand-orange)]"
      >
        Saltar al contenido principal
      </a>

      <AppSidebar
        sections={sections}
        activeSection={activeSection}
        onSelect={onSelectSection}
        alertCount={alertCount}
      />

      <motion.div
        id="app-main"
        tabIndex={-1}
        className="app-main flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
        initial={reduced ? false : { opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduced ? 0 : 0.25, delay: 0.05 }}
      >
        <div className="app-content z-20 px-4 pt-4 sm:px-6 xl:px-8 xl:pt-6">
          <AppHeader activeSection={activeSection} subtitle={subtitle} />
        </div>

        <main className="app-content min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-6 xl:px-8 xl:pt-8">
          <div className="mx-auto w-full max-w-[1680px] space-y-5">
            {dataSource !== "api" ? (
              <DataSourceBanner dataSource={dataSource} loading={loading} onRefresh={onRefresh} />
            ) : null}
            <PageTransition key={activeSection}>
              <div className="view-surface">{children}</div>
            </PageTransition>
          </div>
        </main>
      </motion.div>
    </motion.div>
  );
}
