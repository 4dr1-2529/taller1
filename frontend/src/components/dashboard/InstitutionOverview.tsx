"use client";

import { Building2, GraduationCap, Shield, Users } from "lucide-react";

type Props = {
  institutionName: string;
  directorName: string;
  directorEmail?: string;
  totalStudents: number;
  totalTeachers: number;
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="premium-card rounded-[var(--radius-lg)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
          <p className="text-metric mt-3 font-bold text-[var(--text-primary)]">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function InstitutionOverview({
  institutionName,
  directorName,
  directorEmail,
  totalStudents,
  totalTeachers,
}: Props) {
  return (
    <section className="premium-card overflow-hidden rounded-[var(--radius-lg)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface-muted)]/45 px-6 py-5">
        <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[var(--radius-md)] bg-[var(--accent-muted)] p-2.5 text-[var(--brand-orange)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Comunidad educativa
            </p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{institutionName}</h2>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-2 2xl:grid-cols-3">
        <StatCard
          label="Estudiantes matriculados"
          value={totalStudents}
          icon={Users}
          accent="bg-[var(--surface-muted)] text-[var(--chart-secondary)]"
        />
        <StatCard
          label="Profesores activos"
          value={totalTeachers}
          icon={GraduationCap}
          accent="bg-[var(--surface-muted)] text-[var(--chart-primary)]"
        />
        <div className="premium-card rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-5 sm:col-span-2 2xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Director</p>
              <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">{directorName}</p>
              {directorEmail ? (
                <p className="mt-1 break-all text-sm text-[var(--text-secondary)]">{directorEmail}</p>
              ) : null}
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--accent-muted)] p-2 text-[var(--brand-orange)]">
              <Shield className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
