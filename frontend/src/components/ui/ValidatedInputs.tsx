"use client";

import clsx from "clsx";
import { INPUT_CLASS } from "@/lib/ui";
import {
  DNI_LENGTH,
  PHONE_MAX_DIGITS,
  onlyDigits,
  sanitizeCodigo,
  sanitizeCourseName,
  sanitizeGradeInput,
  sanitizeNonNegativeDecimal,
  sanitizeNonNegativeInt,
  sanitizeObservacion,
  sanitizePercentInput,
  sanitizePersonName,
} from "@/lib/validation";

type ValidatedInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
  inputClassName?: string;
};

function BaseValidatedInput({
  value,
  onValueChange,
  sanitize,
  inputClassName,
  className,
  ...props
}: ValidatedInputProps & { sanitize: (v: string) => string }) {
  return (
    <input
      {...props}
      className={clsx(inputClassName ?? INPUT_CLASS, className)}
      value={value}
      onChange={(e) => onValueChange(sanitize(e.target.value))}
    />
  );
}

export function PersonNameInput(props: ValidatedInputProps) {
  return <BaseValidatedInput {...props} sanitize={sanitizePersonName} />;
}

export function CourseNameInput(props: ValidatedInputProps) {
  return <BaseValidatedInput {...props} sanitize={sanitizeCourseName} />;
}

export function CodigoInput(props: ValidatedInputProps) {
  return <BaseValidatedInput {...props} sanitize={sanitizeCodigo} />;
}

export function DniInput(props: ValidatedInputProps) {
  return (
    <BaseValidatedInput
      {...props}
      inputMode="numeric"
      maxLength={DNI_LENGTH}
      sanitize={(v) => onlyDigits(v, DNI_LENGTH)}
    />
  );
}

export function PhoneInput(props: ValidatedInputProps) {
  return (
    <BaseValidatedInput
      {...props}
      inputMode="numeric"
      maxLength={PHONE_MAX_DIGITS}
      sanitize={(v) => onlyDigits(v, PHONE_MAX_DIGITS)}
    />
  );
}

export function GradeInput(props: ValidatedInputProps) {
  return <BaseValidatedInput {...props} inputMode="decimal" sanitize={sanitizeGradeInput} />;
}

export function PercentInput(props: ValidatedInputProps) {
  return <BaseValidatedInput {...props} inputMode="decimal" sanitize={sanitizePercentInput} />;
}

export function ObservacionInput(props: ValidatedInputProps) {
  return <BaseValidatedInput {...props} sanitize={(v) => sanitizeObservacion(v)} />;
}

export function NonNegativeIntInput(props: ValidatedInputProps) {
  return <BaseValidatedInput {...props} inputMode="numeric" sanitize={sanitizeNonNegativeInt} />;
}

export function NonNegativeDecimalInput(props: ValidatedInputProps) {
  return <BaseValidatedInput {...props} inputMode="decimal" sanitize={sanitizeNonNegativeDecimal} />;
}
