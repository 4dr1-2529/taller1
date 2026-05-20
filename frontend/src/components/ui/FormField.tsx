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
      <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>
      {children}
      {hint && !error ? (
        <span className="block text-[11px] font-medium text-[var(--text-muted)]">{hint}</span>
      ) : null}
      {error ? (
        <span className="block text-[11px] font-medium text-rose-400">{error}</span>
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
          "rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--text-primary)] backdrop-blur-sm transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20",
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
          "rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--text-primary)] backdrop-blur-sm transition-all duration-200 focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20",
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
          "rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--text-primary)] backdrop-blur-sm transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20",
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
