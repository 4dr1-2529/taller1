/**
 * Reglas de validación alineadas con el backend (validators/fields.ts).
 * DNI: 8 dígitos · Teléfono: 9 dígitos · Nota: 0–20 · Asistencia: 0–100 %
 */

export const DNI_LENGTH = 8;
export const PHONE_MAX_DIGITS = 9;
export const GRADE_MAX = 20;
export const PERCENT_MAX = 100;

const PERSON_NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
const CODIGO_REGEX = /^[A-Za-z0-9_-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/** Nombres: solo letras (incl. tildes), espacios, apóstrofe y guión */
export function sanitizePersonName(value: string): string {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, "");
}

/** Código alfanumérico con guión */
export function sanitizeCodigo(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
}

export function validatePersonName(value: string, label: string, required = true): string | undefined {
  const t = value.trim();
  if (!t) return required ? `${label} es obligatorio` : undefined;
  if (t.length < 2) return `${label}: mínimo 2 caracteres`;
  if (!PERSON_NAME_REGEX.test(t)) return `${label}: solo letras (sin números ni símbolos)`;
  return undefined;
}

export function validateCodigo(value: string, required = true): string | undefined {
  const t = value.trim();
  if (!t) return required ? "El código es obligatorio" : undefined;
  if (!CODIGO_REGEX.test(t)) return "Código: solo letras, números, - y _";
  return undefined;
}

export function validateDni(value: string, required = false): string | undefined {
  const t = value.trim();
  if (!t) return required ? "El DNI es obligatorio" : undefined;
  if (!/^\d{8}$/.test(t)) return "El DNI debe tener exactamente 8 dígitos numéricos";
  return undefined;
}

export function validatePhone(value: string, required = false): string | undefined {
  const t = value.trim();
  if (!t) return required ? "El teléfono es obligatorio" : undefined;
  if (!/^\d{9}$/.test(t)) return "El teléfono debe tener 9 dígitos (solo números)";
  return undefined;
}

export function validateEmail(value: string, required = false): string | undefined {
  const t = value.trim();
  if (!t) return required ? "El correo es obligatorio" : undefined;
  if (!EMAIL_REGEX.test(t)) return "Correo electrónico inválido";
  return undefined;
}

export function validateGradeString(value: string, required = true): string | undefined {
  const t = value.trim();
  if (!t) return required ? "Ingrese la nota (0–20)" : undefined;
  if (!/^\d{1,2}(\.\d)?$/.test(t.replace(",", "."))) {
    return "La nota solo puede contener números (0–20)";
  }
  const n = Number.parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n)) return "Nota inválida";
  if (n < 0 || n > GRADE_MAX) return `La nota debe estar entre 0 y ${GRADE_MAX}`;
  return undefined;
}

export function validatePercentString(value: string, required = true): string | undefined {
  const t = value.trim();
  if (!t) return required ? "Ingrese el porcentaje (0–100)" : undefined;
  if (!/^\d{1,3}(\.\d)?$/.test(t.replace(",", "."))) {
    return "Solo números entre 0 y 100";
  }
  const n = Number.parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n)) return "Porcentaje inválido";
  if (n < 0 || n > PERCENT_MAX) return `Debe estar entre 0 y ${PERCENT_MAX}`;
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
  if (!form.seccionId.trim()) errors.seccionId = "Seleccione grado y sección";
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

export function validateTeacherForm(form: TeacherFormInput): FieldErrors {
  const errors: FieldErrors = {};
  const codigo = validateCodigo(form.codigo);
  if (codigo) errors.codigo = codigo;
  Object.assign(errors, validateTeacherProfileFields(form));
  if (form.crearCuenta && form.password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres";
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

export function validateGradeForm(form: GradeFormInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.studentId) errors.studentId = "Seleccione un estudiante";
  if (!form.courseId) errors.courseId = "Seleccione un curso";
  const nota = validateGradeString(form.nota, true);
  if (nota) errors.nota = nota;
  return errors;
}
