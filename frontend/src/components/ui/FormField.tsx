"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { INPUT_CLASS, SELECT_CLASS, TEXTAREA_CLASS } from "@/lib/ui";

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children?: ReactNode;
};

export function FormField({ label, hint, error, className, children }: FormFieldProps) {
  return (
    <label className={clsx("block space-y-2", className)}>
      <span className="block text-sm font-semibold text-[var(--text-secondary)]">
        {label}
      </span>
      {children}
      {hint && !error ? (
        <span className="block text-xs font-medium text-[var(--text-muted)]">{hint}</span>
      ) : null}
      {error ? (
        <span className="block text-xs font-medium text-[var(--danger)]">{error}</span>
      ) : null}
    </label>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string };

export function FormInput({ label, hint, error, className, ...props }: InputProps) {
  return (
    <FormField label={label} hint={hint} error={error} className={className}>
      <input
        className={clsx(
          INPUT_CLASS,
          "min-h-11 rounded-[var(--radius-md)] border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--input-text)] transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]",
          error && "border-rose-500/60 focus:border-rose-500/60 focus:ring-rose-500/20",
        )}
        {...props}
      />
    </FormField>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function FormSelect({ label, hint, error, className, children, ...props }: SelectProps) {
  return (
    <FormField label={label} hint={hint} error={error} className={className}>
      <select
        className={clsx(
          SELECT_CLASS,
          "min-h-11 rounded-[var(--radius-md)] border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--input-text)] transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]",
          error && "border-rose-500/60 focus:border-rose-500/60 focus:ring-rose-500/20",
        )}
        {...props}
      >
        {children}
      </select>
    </FormField>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function FormTextarea({ label, hint, error, className, ...props }: TextareaProps) {
  return (
    <FormField label={label} hint={hint} error={error} className={className}>
      <textarea
        className={clsx(
          TEXTAREA_CLASS,
          "min-h-11 rounded-[var(--radius-md)] border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--input-text)] transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]",
          error && "border-rose-500/60 focus:border-rose-500/60 focus:ring-rose-500/20",
        )}
        {...props}
      />
    </FormField>
  );
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("grid gap-5 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}
