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
    <label className={clsx("block space-y-1.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>
      {children}
      {hint && !error ? <span className="block text-[11px] text-[var(--text-muted)]">{hint}</span> : null}
      {error ? <span className="block text-[11px] text-rose-400">{error}</span> : null}
    </label>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string };

export function FormInput({ label, hint, error, className, ...props }: InputProps) {
  return (
    <FormField label={label} hint={hint} error={error} className={className}>
      <input className={clsx(INPUT_CLASS, error && "border-rose-500/60")} {...props} />
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
      <select className={clsx(SELECT_CLASS, error && "border-rose-500/60")} {...props}>
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
      <textarea className={clsx(TEXTAREA_CLASS, error && "border-rose-500/60")} {...props} />
    </FormField>
  );
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}
