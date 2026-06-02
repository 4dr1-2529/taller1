"use client";

import { useMemo, useState } from "react";
import { Database } from "lucide-react";
import { SearchField } from "@/components/ui/SearchField";
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
  emptyHint?: ReactNode;
  isEmpty?: boolean;
  hideToolbarWhenEmpty?: boolean;
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
  emptyHint,
  isEmpty,
  hideToolbarWhenEmpty,
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

  const handleSearch = (q: string) => {
    setInternalSearch(q);
    onSearch?.(q);
  };

  return (
    <PageSection title={title} description={description} variant="table" className={clsx("overflow-hidden", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity duration-500 pointer-events-none" />

        {!(hideToolbarWhenEmpty && isEmpty) ? (
        <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/40 px-5 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between md:px-6">
          <SearchField
            className="min-w-0 flex-1 sm:max-w-sm"
            value={search}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
          />

          <div className="flex flex-wrap items-center gap-2">
            {toolbar ? (
              <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
            ) : null}
            <TableExportButtons onExportPdf={onExportPdf} onExportExcel={onExportExcel} />
          </div>
        </div>
        ) : null}
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

        <div className="overflow-x-auto px-2 pb-2 md:px-4 md:pb-4">
          {isEmpty ? (
            <div className="empty-state-panel py-12 md:py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/12 to-cyan-500/10 ring-1 ring-[var(--border-subtle)]">
                <Database className="h-7 w-7 text-violet-500/70 dark:text-violet-300/80" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">Sin registros en esta tabla</p>
              <p className="mt-1.5 max-w-sm text-center text-xs leading-relaxed text-[var(--text-muted)]">{emptyMessage}</p>
              {emptyHint}
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
