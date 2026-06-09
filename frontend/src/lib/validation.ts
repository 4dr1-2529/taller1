/**
 * Reglas de validación alineadas con el backend (validators/fields.ts).
 * DNI: 8 dígitos · Teléfono: 9 dígitos · Nota: 0–20 · Asistencia: 0–100 %
 */

import { isCodigo, isPersonName, isValidEmail } from "./text-validation";

export const DNI_LENGTH = 8;
export const PHONE_MAX_DIGITS = 9;
export const GRADE_MAX = 20;
export const PERCENT_MAX = 100;

/** Mensajes estándar (director, profesor, estudiante) */
export const VALIDATION_MSG = {
  required: "Este campo es obligatorio.",
  lettersOnly: "Solo se permiten letras.",
  numbersOnly: "Solo se permiten números.",
  gradeRange: "La nota debe estar entre 0 y 20.",
  percentRange: "La asistencia debe estar entre 0 y 100.",
  probabilityRange: "La probabilidad debe estar entre 0 y 100.",
  scoreRange: "El score debe estar entre 0 y 100.",
  dni: "DNI debe tener 8 dígitos.",
  phone: "Teléfono debe tener 9 dígitos.",
  email: "Correo electrónico inválido.",
  codigo: "Código: solo letras, números, - y _",
  minName: "Mínimo 2 caracteres.",
} as const;

export type FieldErrors = Partial<Record<string, string>>;

/** Quita el error de un campo al editar */
export function clearFieldError(errors: FieldErrors, key: string): FieldErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}

/** Solo dígitos, con límite opcional de longitud */
export function onlyDigits(value: string, maxLen?: number): string {
  const digits = value.replace(/\D/g, "");
  return maxLen !== undefined ? digits.slice(0, maxLen) : digits;
}

/** Nota o promedio 0–20 (un decimal opcional) */
export function sanitizeGradeInput(value: string): string {
  let v = value.replace(",", ".").replace(/[^\d.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = `${parts[0]}.${parts.slice(1).join("")}`;
  const [intPart = "", decPart] = v.split(".");
  const intClean = intPart.slice(0, 2);
  const decClean = decPart !== undefined ? decPart.slice(0, 1) : undefined;
  let out = intClean;
  if (decClean !== undefined) out += `.${decClean}`;
  const n = Number.parseFloat(out);
  if (Number.isFinite(n) && n > GRADE_MAX) return String(GRADE_MAX);
  return out;
}

/** Porcentaje 0–100 (entero o un decimal) */
export function sanitizePercentInput(value: string): string {
  let v = value.replace(",", ".").replace(/[^\d.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = `${parts[0]}.${parts.slice(1).join("")}`;
  const [intPart = "", decPart] = v.split(".");
  const intClean = intPart.slice(0, 3);
  const decClean = decPart !== undefined ? decPart.slice(0, 1) : undefined;
  let out = intClean;
  if (decClean !== undefined) out += `.${decClean}`;
  const n = Number.parseFloat(out);
  if (Number.isFinite(n) && n > PERCENT_MAX) return String(PERCENT_MAX);
  return out;
}

/** Observaciones cortas: letras, espacios y tildes (sin números) */
export function sanitizeObservacion(value: string, maxLen = 500): string {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.,;:!?()-]/g, "").slice(0, maxLen);
}

/** Entero >= 0 */
export function sanitizeNonNegativeInt(value: string, maxLen = 6): string {
  return onlyDigits(value, maxLen);
}

/** Decimal >= 0 */
export function sanitizeNonNegativeDecimal(value: string): string {
  let v = value.replace(",", ".").replace(/[^\d.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = `${parts[0]}.${parts.slice(1).join("")}`;
  const [intPart = "", decPart] = v.split(".");
  let out = intPart.slice(0, 6);
  if (decPart !== undefined) out += `.${decPart.slice(0, 2)}`;
  return out;
}

/** Nombres: solo letras (incl. tildes), espacios, apóstrofe y guión */
export function sanitizePersonName(value: string): string {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, "");
}

/** Código alfanumérico con guión */
export function sanitizeCodigo(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
}

/** Nombre de curso (sin números) */
export function sanitizeCourseName(value: string): string {
  return sanitizePersonName(value);
}

export function validatePersonName(value: string, label: string, required = true): string | undefined {
  const t = value.trim();
  if (!t) return required ? VALIDATION_MSG.required : undefined;
  if (t.length < 2) return VALIDATION_MSG.minName;
  if (!isPersonName(t)) return VALIDATION_MSG.lettersOnly;
  return undefined;
}

export function validateCodigo(value: string, required = true): string | undefined {
  const t = value.trim();
  if (!t) return required ? VALIDATION_MSG.required : undefined;
  if (!isCodigo(t)) return VALIDATION_MSG.codigo;
  return undefined;
}

export function validateDni(value: string, required = false): string | undefined {
  const t = value.trim();
  if (!t) return required ? VALIDATION_MSG.required : undefined;
  if (!/^\d{8}$/.test(t)) return VALIDATION_MSG.dni;
  return undefined;
}

export function validatePhone(value: string, required = false): string | undefined {
  const t = value.trim();
  if (!t) return required ? VALIDATION_MSG.required : undefined;
  if (!/^\d{9}$/.test(t)) return VALIDATION_MSG.phone;
  return undefined;
}

export function validateEmail(value: string, required = false): string | undefined {
  const t = value.trim();
  if (!t) return required ? VALIDATION_MSG.required : undefined;
  if (!isValidEmail(t)) return VALIDATION_MSG.email;
  return undefined;
}

export function validateGradeString(value: string, required = true): string | undefined {
  const t = value.trim();
  if (!t) return required ? VALIDATION_MSG.required : undefined;
  if (!/^\d{1,2}(\.\d)?$/.test(t.replace(",", "."))) return VALIDATION_MSG.numbersOnly;
  const n = Number.parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n)) return VALIDATION_MSG.numbersOnly;
  if (n < 0 || n > GRADE_MAX) return VALIDATION_MSG.gradeRange;
  return undefined;
}

export function validatePercentString(value: string, required = true): string | undefined {
  const t = value.trim();
  if (!t) return required ? VALIDATION_MSG.required : undefined;
  if (!/^\d{1,3}(\.\d)?$/.test(t.replace(",", "."))) return VALIDATION_MSG.numbersOnly;
  const n = Number.parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n)) return VALIDATION_MSG.numbersOnly;
  if (n < 0 || n > PERCENT_MAX) return VALIDATION_MSG.percentRange;
  return undefined;
}

export function validateObservacion(value: string, required = false): string | undefined {
  const t = value.trim();
  if (!t) return required ? VALIDATION_MSG.required : undefined;
  if (t.length > 500) return "Máximo 500 caracteres";
  if (/[0-9]/.test(t)) return VALIDATION_MSG.lettersOnly;
  return undefined;
}

export function validateNonNegativeIntString(value: string, required = true): string | undefined {
  const t = value.trim();
  if (!t) return required ? VALIDATION_MSG.required : undefined;
  if (!/^\d+$/.test(t)) return VALIDATION_MSG.numbersOnly;
  return undefined;
}

export function parseGrade(value: string): number | null {
  const err = validateGradeString(value, true);
  if (err) return null;
  return Number.parseFloat(value.replace(",", "."));
}

export function parsePercent(value: string): number | null {
  const err = validatePercentString(value, true);
  if (err) return null;
  return Number.parseFloat(value.replace(",", "."));
}

export function firstError(errors: FieldErrors): string | undefined {
  return Object.values(errors)[0];
}

export type StudentFormInput = {
  codigo: string;
  nombres: string;
  apellidos: string;
  seccionId: string;
  dni: string;
  correo: string;
  telefono: string;
  promedioGeneral: string;
  asistenciaGeneral: string;
};

export function validateStudentForm(form: StudentFormInput): FieldErrors {
  const errors: FieldErrors = {};
  const codigo = validateCodigo(form.codigo);
  if (codigo) errors.codigo = codigo;
  const nombres = validatePersonName(form.nombres, "Nombres");
  if (nombres) errors.nombres = nombres;
  const apellidos = validatePersonName(form.apellidos, "Apellidos");
  if (apellidos) errors.apellidos = apellidos;
  if (!form.seccionId.trim()) errors.seccionId = VALIDATION_MSG.required;
  const dni = validateDni(form.dni, false);
  if (dni) errors.dni = dni;
  const correo = validateEmail(form.correo, false);
  if (correo) errors.correo = correo;
  const telefono = validatePhone(form.telefono, false);
  if (telefono) errors.telefono = telefono;
  if (form.promedioGeneral.trim()) {
    const p = validateGradeString(form.promedioGeneral, false);
    if (p) errors.promedioGeneral = p;
  }
  if (form.asistenciaGeneral.trim()) {
    const a = validatePercentString(form.asistenciaGeneral, false);
    if (a) errors.asistenciaGeneral = a;
  }
  return errors;
}

export type TeacherFormInput = {
  codigo: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string;
  crearCuenta: boolean;
  password: string;
};

export function validateTeacherForm(form: TeacherFormInput & { cursos?: TeacherCourseInput[] }): FieldErrors {
  const errors: FieldErrors = {};
  const codigo = validateCodigo(form.codigo);
  if (codigo) errors.codigo = codigo;
  Object.assign(errors, validateTeacherProfileFields(form));
  if (form.crearCuenta && form.password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres";
  }
  for (const [i, c] of (form.cursos ?? []).entries()) {
    if (!c.codigo.trim() && !c.nombre.trim() && !c.seccionId) continue;
    Object.assign(errors, validateTeacherCourseRow(c, i));
  }
  return errors;
}

export type TeacherProfileInput = Pick<
  TeacherFormInput,
  "nombres" | "apellidos" | "especialidad" | "correo" | "telefono"
>;

export function validateTeacherProfileFields(form: TeacherProfileInput): FieldErrors {
  const errors: FieldErrors = {};
  const nombres = validatePersonName(form.nombres, "Nombres");
  if (nombres) errors.nombres = nombres;
  const apellidos = validatePersonName(form.apellidos, "Apellidos");
  if (apellidos) errors.apellidos = apellidos;
  const esp = validatePersonName(form.especialidad, "Especialidad");
  if (esp) errors.especialidad = esp;
  const correo = validateEmail(form.correo, true);
  if (correo) errors.correo = correo;
  const telefono = validatePhone(form.telefono, false);
  if (telefono) errors.telefono = telefono;
  return errors;
}

export type GradeFormInput = {
  studentId: string;
  courseId: string;
  nota: string;
};

export function validateGradeForm(form: GradeFormInput & { observacion?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.studentId) errors.studentId = VALIDATION_MSG.required;
  if (!form.courseId) errors.courseId = VALIDATION_MSG.required;
  const nota = validateGradeString(form.nota, true);
  if (nota) errors.nota = nota;
  if (form.observacion?.trim()) {
    const obs = validateObservacion(form.observacion, false);
    if (obs) errors.observacion = obs;
  }
  return errors;
}

export type CourseFormInput = {
  codigo: string;
  nombre: string;
  profesorId: string;
  gradoId: string;
  seccionId: string;
};

export function validateCourseForm(form: CourseFormInput): FieldErrors {
  const errors: FieldErrors = {};
  const codigo = validateCodigo(form.codigo);
  if (codigo) errors.codigo = codigo;
  const nombre = validatePersonName(form.nombre, "Nombre", true);
  if (nombre) errors.nombre = nombre;
  if (!form.profesorId) errors.profesorId = VALIDATION_MSG.required;
  if (!form.gradoId || !form.seccionId) errors.seccionId = VALIDATION_MSG.required;
  return errors;
}

export type MatriculaFormInput = {
  estudianteId: string;
  seccionId: string;
  anioLectivoId: string;
};

export function validateMatriculaForm(form: MatriculaFormInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.estudianteId) errors.estudianteId = VALIDATION_MSG.required;
  if (!form.seccionId) errors.seccionId = VALIDATION_MSG.required;
  if (!form.anioLectivoId) errors.anioLectivoId = VALIDATION_MSG.required;
  return errors;
}

export type TeacherCourseInput = {
  codigo: string;
  nombre: string;
  seccionId: string;
};

export function validateTeacherCourseRow(row: TeacherCourseInput, index: number): FieldErrors {
  const errors: FieldErrors = {};
  const prefix = `curso_${index}`;
  const codigo = validateCodigo(row.codigo, true);
  if (codigo) errors[`${prefix}_codigo`] = codigo;
  const nombre = validatePersonName(row.nombre, "Nombre del curso", true);
  if (nombre) errors[`${prefix}_nombre`] = nombre;
  if (!row.seccionId) errors[`${prefix}_seccionId`] = VALIDATION_MSG.required;
  return errors;
}
