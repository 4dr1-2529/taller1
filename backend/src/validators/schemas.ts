import { z } from "zod";
import {
  codigoField,
  courseNameField,
  gradeField,
  observacionField,
  optionalDniField,
  optionalEmailField,
  optionalPhoneField,
  percentageField,
  personNameField,
  roleCodeField,
  securePasswordField,
} from "./fields.js";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Correo inválido")
    .max(255)
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
});

export const createUserSchema = z.object({
  email: z.string().email("Correo inválido").max(255).transform((v) => v.trim().toLowerCase()),
  password: securePasswordField,
  nombres: personNameField,
  apellidos: personNameField,
  role: roleCodeField.default("estudiante"),
  dni: optionalDniField,
  telefono: optionalPhoneField,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Contraseña actual requerida"),
  newPassword: securePasswordField,
});

export const studentSchema = z.object({
  nombres: personNameField,
  apellidos: personNameField,
  seccionId: z.string().regex(/^[1-9]\d*$/, "Seleccione grado y sección"),
  dni: z.string().regex(/^\d{8}$/, "DNI debe tener 8 dígitos"),
  correo: optionalEmailField,
  telefono: optionalPhoneField,
}).strict();

export const updateStudentSchema = studentSchema.omit({ seccionId: true }).partial().extend({
  estado: z.enum(["activo", "retirado"]).optional(),
}).strict().refine(d => Object.keys(d).length > 0, { message: "Indique campos para actualizar" });

export const enrollmentSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
});

export const matriculaSchema = z.object({
  estudianteId: z.string().min(1, "Seleccione estudiante"),
  seccionId: z.string().min(1, "Seleccione sección"),
  anioLectivoId: z.string().min(1, "Seleccione año lectivo"),
  estado: z.literal("activa").optional(),
}).strict();

export const gradeSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  periodoId: z.string().optional(),
  periodoNumero: z.coerce.number().int().min(1).max(4).optional(),
  nota: gradeField,
  observacion: observacionField,
});

export const attendanceSchema = z.object({
  studentId: z.string().min(1),
  fecha: z.string().regex(/^2026-\d{2}-\d{2}$/, "Fecha del año 2026 requerida").refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, "Fecha inválida"),
  presente: z.boolean().default(true),
  justificado: z.boolean().default(false),
  tardanza: z.boolean().default(false),
  observacion: observacionField,
});

export const predictSchema = z.object({ studentId: z.string().regex(/^[1-9]\d*$/) }).strict();

export const messageSchema = z.object({
  roomId: z.string().min(1).optional(),
  contenido: z.string().min(1).max(4000),
  scope: z.enum(["global", "profesores", "curso", "directo"]).optional(),
  recipientUserId: z.string().optional(),
  courseId: z.string().optional(),
  parentMessageId: z.string().optional(),
});

export const alertStatusSchema = z.object({
  status: z.enum(["nueva", "en_seguimiento", "resuelta"]),
});

export const teacherSchema = z.object({
  dni: z.string().regex(/^\d{8}$/, "DNI debe tener 8 dígitos"),
  nombres: personNameField, apellidos: personNameField, especialidad: personNameField,
  correo: z.string().email().max(120).transform(v => v.trim().toLowerCase()),
  telefono: optionalPhoneField, password: securePasswordField.optional(),
  crearCuenta: z.boolean().optional(),
}).strict().refine(d => !d.crearCuenta || !!d.password, { message: "Contraseña requerida", path: ["password"] });

export const updateTeacherSchema = z.object({
  nombres: personNameField.optional(),
  apellidos: personNameField.optional(),
  especialidad: personNameField.optional(),
  correo: z.string().email("Correo inválido").max(255).optional(),
  telefono: optionalPhoneField.nullable().optional(),
  activo: z.boolean().optional(),
});

export const teacherAccountSchema = z.object({
  password: z.string().min(8).max(128),
});

export const courseSchema = z.object({
  codigo: codigoField,
  nombre: courseNameField,
  profesorId: z.string().min(1),
  seccionId: z.string().min(1, "Seleccione grado y sección"),
  cursoCatalogoId: z.string().optional(),
  periodo: z.string().max(16).default("2026"),
});

export const seccionSchema = z.object({
  nombre: z.string().min(1).max(8),
  gradoId: z.coerce.number().int().positive(),
  capacidad: z.coerce.number().int().min(1).max(60).default(30),
});

export const bulkAttendanceSchema = z.object({
  fecha: attendanceSchema.shape.fecha,
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        presente: z.boolean().default(true),
        justificado: z.boolean().default(false),
        tardanza: z.boolean().default(false),
        observacion: z.string().max(500).optional(),
      }),
    )
    .min(1, "Debe enviar al menos un registro")
    .max(200),
});

export const updateAttendanceSchema = attendanceSchema.partial().extend({
  studentId: z.string().min(1).optional(),
  fecha: z.string().optional(),
});

export const createAssignmentSchema = z.object({
  profesorId: z.string().min(1, "Seleccione profesor"),
  cursoId: z.string().min(1, "Seleccione curso del catálogo"),
  seccionId: z.string().min(1, "Seleccione sección"),
  anioLectivoId: z.string().optional(),
  esTutor: z.boolean().optional(),
});

export const createTutorAssignmentSchema = z.object({
  profesorId: z.string().min(1, "Seleccione profesor"),
  seccionId: z.string().min(1, "Seleccione sección"),
  anioLectivoId: z.string().optional(),
});

export const listAssignmentsQuerySchema = z.object({
  profesorId: z.string().optional(),
  cursoId: z.string().optional(),
  gradoId: z.string().optional(),
  seccionId: z.string().optional(),
  anioLectivoId: z.string().optional(),
  esTutor: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  activo: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? true : v === "true")),
});
