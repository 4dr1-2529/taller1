import { z } from "zod";
import { isCodigo, isPersonName } from "@tesis/shared";

/** DNI peruano: exactamente 8 dígitos */
export const DNI_REGEX = /^\d{8}$/;

/** Celular Perú: 9 dígitos (sin letras) */
export const PHONE_REGEX = /^\d{9}$/;

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
  .refine(isPersonName, "Solo letras, espacios, apóstrofes o guiones");

export const codigoField = z
  .string()
  .min(2, "Mínimo 2 caracteres")
  .max(32)
  .refine(isCodigo, "Solo letras, números, guión (-) y guión bajo (_)");

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
    .regex(PHONE_REGEX, "Teléfono debe tener 9 dígitos")
    .optional(),
);

export const observacionField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .max(500)
    .refine(isPersonName, "Solo se permiten letras")
    .optional(),
);

export const courseNameField = personNameField;

export const gradeField = z.coerce
  .number({ invalid_type_error: "Solo se permiten números" })
  .min(0, "La nota debe estar entre 0 y 20")
  .max(GRADE_MAX, "La nota debe estar entre 0 y 20");

export const percentageField = z.coerce
  .number({ invalid_type_error: "Solo se permiten números" })
  .min(0, "La asistencia debe estar entre 0 y 100")
  .max(PERCENT_MAX, "La asistencia debe estar entre 0 y 100");

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
