"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
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
  return (
    <motion.div
      className="app-bg relative flex h-screen overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="app-orb app-orb-violet" aria-hidden />
      <div className="app-orb app-orb-cyan" aria-hidden />

      <AppSidebar
        sections={sections}
        activeSection={activeSection}
        onSelect={onSelectSection}
        alertCount={alertCount}
      />

      <motion.div
        className="app-main flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="app-content z-20 px-4 pt-3 sm:px-6 md:px-8 md:pt-5 lg:pl-7">
          <AppHeader activeSection={activeSection} subtitle={subtitle} />
        </div>

        <main className="app-content flex-1 px-4 pb-8 pt-4 sm:px-6 md:px-8 md:pb-10 md:pt-5 lg:pl-7">
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
