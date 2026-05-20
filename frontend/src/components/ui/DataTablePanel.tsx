"use client";

import { useMemo, useState } from "react";
import { Search, Database, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";
import { PageSection } from "@/components/ui/PageSection";
import { TableExportButtons, TablePagination } from "@/components/ui/TableToolbar";

type DataTablePanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
  toolbar?: ReactNode;
  className?: string;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
};

export function DataTablePanel({
  title,
  description,
  children,
  searchPlaceholder = "Buscar…",
  onSearch,
  searchValue: controlledSearch,
  emptyMessage = "No hay registros.",
  isEmpty,
  toolbar,
  className,
  onExportPdf,
  onExportExcel,
  page,
  pageSize = 10,
  totalItems,
  onPageChange,
}: DataTablePanelProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const search = controlledSearch ?? internalSearch;
  const isFocused = false;

  const handleSearch = (q: string) => {
    setInternalSearch(q);
    onSearch?.(q);
  };

  return (
    <PageSection title={title} description={description} variant="table" className={clsx("overflow-hidden", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity duration-500 pointer-events-none" />

        <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/40 px-5 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="group relative min-w-0 flex-1 sm:max-w-sm">
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/20 to-cyan-500/20 opacity-0 blur-md transition-opacity duration-300 group-focus-within:opacity-100" />
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] transition-colors duration-200 group-focus-within:text-violet-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60 backdrop-blur-sm transition-all duration-200 focus:border-violet-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-violet-500/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                  aria-label="Limpiar búsqueda"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {toolbar ? (
              <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
            ) : null}
            <TableExportButtons onExportPdf={onExportPdf} onExportExcel={onExportExcel} />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-sm transition-all duration-200 hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-[var(--text-primary)]"
              aria-label="Filtros avanzados"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

        <div className="overflow-x-auto px-2 pb-2 md:px-4 md:pb-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 md:py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 ring-1 ring-white/[0.06]">
                <Database className="h-7 w-7 text-[var(--text-muted)]" />
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Sin datos disponibles</p>
                <p className="max-w-xs text-xs text-[var(--text-muted)]">{emptyMessage}</p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {totalItems != null && totalItems > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-5 py-3 md:px-6">
          <p className="text-xs text-[var(--text-muted)]">
            {totalItems} registro{totalItems === 1 ? "" : "s"}
          </p>
          <TablePagination
            page={page ?? 1}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </PageSection>
  );
}

export function useTableFilter<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string,
) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getSearchText(item).toLowerCase().includes(q));
  }, [items, query, getSearchText]);
}

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={clsx("data-table min-w-full", className)}>{children}</table>;
}
