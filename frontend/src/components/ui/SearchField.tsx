"use client";

import { Search } from "lucide-react";
import clsx from "clsx";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder = "Buscar…",
  className,
  id,
}: SearchFieldProps) {
  return (
    <div className={clsx("search-field", className)}>
      <Search className="search-field__icon" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-premium search-field__input"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="search-field__clear"
          aria-label="Limpiar búsqueda"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
