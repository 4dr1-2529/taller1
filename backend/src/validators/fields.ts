import { z } from "zod";

/** DNI peruano: exactamente 8 dígitos */
export const DNI_REGEX = /^\d{8}$/;

/** Celular Perú: 9 dígitos (sin letras) */
export const PHONE_REGEX = /^\d{9}$/;

/** Nombres y apellidos */
export const PERSON_NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

/** Código institucional (ej. 2024-001, DOC-01) */
export const CODIGO_REGEX = /^[A-Za-z0-9_-]+$/;

export const DNI_LENGTH = 8;
export const PHONE_MAX_DIGITS = 9;
export const GRADE_MAX = 20;
export const PERCENT_MAX = 100;

function emptyToUndefined(val: unknown): unknown {
  if (val === "" || val === null || val === undefined) return undefined;
  return val;
}

export const personNameField = z
  .string()
  .min(2, "Mínimo 2 caracteres")
  .max(120)
  .regex(PERSON_NAME_REGEX, "Solo letras, espacios, apóstrofes o guiones");

export const codigoField = z
  .string()
  .min(2, "Mínimo 2 caracteres")
  .max(32)
  .regex(CODIGO_REGEX, "Solo letras, números, guión (-) y guión bajo (_)");

export const optionalDniField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(DNI_REGEX, "El DNI debe tener exactamente 8 dígitos numéricos")
    .optional(),
);

export const optionalPhoneField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(PHONE_REGEX, "El teléfono debe tener 9 dígitos (solo números)")
    .optional(),
);

export const gradeField = z.coerce
  .number({ invalid_type_error: "Ingrese un número válido" })
  .min(0, "Mínimo 0")
  .max(GRADE_MAX, `Máximo ${GRADE_MAX}`);

export const percentageField = z.coerce
  .number({ invalid_type_error: "Ingrese un porcentaje válido" })
  .min(0, "Mínimo 0%")
  .max(PERCENT_MAX, `Máximo ${PERCENT_MAX}%`);

export const securePasswordField = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(128)
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[a-z]/, "Debe incluir al menos una minúscula")
  .regex(/\d/, "Debe incluir al menos un número");

export const roleCodeField = z.enum(["admin", "docente", "estudiante"], {
  errorMap: () => ({ message: "Rol inválido. Use admin, docente o estudiante" }),
});

export const optionalEmailField = z
  .string()
  .email("Correo inválido")
  .max(255)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));
