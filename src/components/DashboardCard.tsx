type DashboardCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export function DashboardCard({ title, value, subtitle }: DashboardCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
    </article>
  );
}
