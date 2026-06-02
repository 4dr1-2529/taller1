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
    <div className="premium-card rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
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
    <section className="premium-card overflow-hidden rounded-2xl">
      <div className="border-b border-[var(--border)] bg-gradient-to-r from-violet-500/10 via-cyan-500/5 to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-violet-500/15 p-2.5 text-violet-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Comunidad educativa
            </p>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{institutionName}</h2>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-3">
        <StatCard
          label="Estudiantes matriculados"
          value={totalStudents}
          icon={Users}
          accent="bg-cyan-500/15 text-cyan-400"
        />
        <StatCard
          label="Profesores activos"
          value={totalTeachers}
          icon={GraduationCap}
          accent="bg-violet-500/15 text-violet-400"
        />
        <div className="premium-card rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 md:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Director</p>
              <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">{directorName}</p>
              {directorEmail ? (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{directorEmail}</p>
              ) : null}
            </div>
            <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400">
              <Shield className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
