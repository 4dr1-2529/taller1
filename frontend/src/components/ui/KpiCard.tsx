"use client";

import type { LucideIcon } from "lucide-react";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "rose" | "amber" | "emerald" | "cyan" | "indigo";
  subtitle?: string;
};

const tones = { rose: "danger", amber: "warning", emerald: "success", cyan: "neutral", indigo: "brand" } as const;

export function KpiCard({ label, value, icon, variant = "indigo", subtitle }: KpiCardProps) {
  return <DashboardMetricCard label={label} value={value} icon={icon} tone={tones[variant]} description={subtitle} />;
}
