"use client";

import { FileDown, FileSpreadsheet } from "lucide-react";

type TableToolbarProps = {
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
};

export function TableExportButtons({ onExportPdf, onExportExcel }: Pick<TableToolbarProps, "onExportPdf" | "onExportExcel">) {
  return (
    <>
      {onExportPdf ? (
        <button type="button" className="btn-secondary text-xs py-2" onClick={onExportPdf}>
          <FileDown className="h-3.5 w-3.5" />
          PDF
        </button>
      ) : null}
      {onExportExcel ? (
        <button type="button" className="btn-secondary text-xs py-2" onClick={onExportExcel}>
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Excel
        </button>
      ) : null}
    </>
  );
}

export function TablePagination({
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
}: Pick<TableToolbarProps, "page" | "pageSize" | "total" | "onPageChange">) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pages;

  if (total <= pageSize) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
      <button
        type="button"
        disabled={!canPrev}
        className="btn-ghost py-1.5 disabled:opacity-40"
        onClick={() => onPageChange?.(page - 1)}
      >
        Anterior
      </button>
      <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 ring-1 ring-white/[0.06]">
        {page} / {pages}
      </span>
      <button
        type="button"
        disabled={!canNext}
        className="btn-ghost py-1.5 disabled:opacity-40"
        onClick={() => onPageChange?.(page + 1)}
      >
        Siguiente
      </button>
    </div>
  );
}
