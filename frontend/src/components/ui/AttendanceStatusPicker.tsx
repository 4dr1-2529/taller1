"use client";

import clsx from "clsx";
import { Check, Clock, FileWarning, UserX } from "lucide-react";
import {
  ATTENDANCE_ESTADOS,
  type AttendanceEstado,
} from "@/lib/attendance-status";

const ICONS = {
  presente: Check,
  tardanza: Clock,
  falta: UserX,
  falta_justificada: FileWarning,
} as const;

type AttendanceStatusPickerProps = {
  value: AttendanceEstado;
  onChange: (value: AttendanceEstado) => void;
};

export function AttendanceStatusPicker({ value, onChange }: AttendanceStatusPickerProps) {
  return (
    <div className="attendance-picker" role="radiogroup" aria-label="Estado de asistencia">
      {ATTENDANCE_ESTADOS.map((opt) => {
        const Icon = ICONS[opt.value];
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.hint}
            onClick={() => onChange(opt.value)}
            className={clsx("attendance-picker__option", active && "attendance-picker__option--active")}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="attendance-picker__label">{opt.label}</span>
          </button>
        );
      })}
      <p className="attendance-picker__hint">
        {ATTENDANCE_ESTADOS.find((e) => e.value === value)?.hint}
      </p>
    </div>
  );
}
