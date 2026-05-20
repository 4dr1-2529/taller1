"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";
import { PageSection } from "@/components/ui/PageSection";

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
}: DataTablePanelProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const search = controlledSearch ?? internalSearch;

  const handleSearch = (q: string) => {
    setInternalSearch(q);
    onSearch?.(q);
  };

  return (
    <PageSection title={title} description={description} variant="table" className={className}>
      <div className="table-toolbar flex flex-col gap-3 border-b border-[var(--border-subtle)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="input-premium py-2 pl-9 text-sm"
          />
        </div>
        {toolbar ? <div className="flex flex-wrap gap-2">{toolbar}</div> : null}
      </div>
      <div className="overflow-x-auto px-2 pb-2 md:px-4 md:pb-4">
        {isEmpty ? (
          <p className="py-12 text-center text-sm text-[var(--text-muted)]">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
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
