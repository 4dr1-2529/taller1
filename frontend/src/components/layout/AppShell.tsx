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
      className="app-bg relative flex min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="app-orb app-orb-violet"
        animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="app-orb app-orb-cyan"
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="app-orb app-orb-fuchsia"
        animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      <AppSidebar
        sections={sections}
        activeSection={activeSection}
        onSelect={onSelectSection}
        alertCount={alertCount}
      />

      <motion.div
        className="app-main flex min-h-screen min-w-0 flex-1 flex-col"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="app-content sticky top-0 z-20 px-4 pt-4 md:px-8 md:pt-6 lg:pl-0">
          <AppHeader activeSection={activeSection} subtitle={subtitle} />
        </div>

        <main className="app-content flex-1 px-4 pb-10 pt-5 md:px-8 md:pb-12 md:pt-6">
          <div className="mx-auto w-full max-w-[1680px] space-y-6">
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
