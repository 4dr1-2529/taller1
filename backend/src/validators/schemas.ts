import { z } from "zod";
import {
  bimestreField,
  codigoField,
  gradeField,
  optionalDniField,
  optionalEmailField,
  optionalPhoneField,
  percentageField,
  personNameField,
} from "./fields.js";

export const loginSchema = z.object({
  email: z.string().email("Correo inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
});

export const createUserSchema = z.object({
  email: z.string().email("Correo inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
  nombres: personNameField,
  apellidos: personNameField,
  role: z.enum(["admin", "docente", "estudiante"]).default("estudiante"),
  dni: optionalDniField,
  telefono: optionalPhoneField,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Mínimo 8 caracteres").max(128),
});

export const studentSchema = z.object({
  codigo: codigoField,
  nombres: personNameField,
  apellidos: personNameField,
  seccionId: z.string().min(1, "Seleccione grado y sección"),
  dni: optionalDniField,
  correo: optionalEmailField,
  telefono: optionalPhoneField,
  estado: z.enum(["activo", "en_riesgo", "retirado"]).optional(),
  promedioGeneral: gradeField.optional(),
  asistenciaGeneral: percentageField.optional(),
  lmsEngagement: z.enum(["alto", "medio", "bajo"]).optional(),
});

export const enrollmentSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  periodo: z.string().default("2026-I"),
});

export const gradeSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  periodo: z.string().min(4).default("2026-I"),
  bimestre: bimestreField,
  nota: gradeField,
  observacion: z.string().max(500).optional(),
});

export const attendanceSchema = z.object({
  studentId: z.string().min(1),
  fecha: z.string().min(1),
  presente: z.boolean().default(true),
  justificado: z.boolean().default(false),
  tardanza: z.boolean().default(false),
  observacion: z.string().max(500).optional(),
});

export const predictSchema = z.object({
  studentId: z.string().optional(),
  metrics: z
    .object({
      promedioGeneral: gradeField,
      asistenciaGeneral: percentageField,
      lms: z.object({
        engagement: z.enum(["alto", "medio", "bajo"]).optional(),
        actividadSemanalPct: z.array(percentageField),
        minutosPorSemana: z.array(z.number().min(0)).optional(),
        tareasEntregadas: z.number().min(0),
        tareasTotales: z.number().min(1),
        horasPlataformaSemana: z.number().min(0).optional(),
      }),
    })
    .optional(),
  estado: z.enum(["activo", "en_riesgo", "retirado"]).optional(),
});

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

const teacherCourseInput = z.object({
  codigo: codigoField,
  nombre: z.string().min(2).max(160),
  seccionId: z.string().min(1, "Seleccione grado y sección"),
  cursoCatalogoId: z.string().optional(),
  periodo: z.string().max(16).optional(),
});

export const teacherSchema = z
  .object({
    codigo: codigoField,
    nombres: personNameField,
    apellidos: personNameField,
    especialidad: z.string().min(2).max(120),
    correo: z.string().email("Correo inválido").max(255),
    telefono: optionalPhoneField,
    password: z.string().min(8).max(128).optional(),
    crearCuenta: z.boolean().optional(),
    cursos: z.array(teacherCourseInput).max(12).optional(),
  })
  .refine((d) => !d.crearCuenta || (d.password && d.password.length >= 8), {
    message: "Indique una contraseña de al menos 8 caracteres para la cuenta",
    path: ["password"],
  });

export const updateTeacherSchema = z.object({
  nombres: personNameField.optional(),
  apellidos: personNameField.optional(),
  especialidad: z.string().min(2).max(120).optional(),
  correo: z.string().email("Correo inválido").max(255).optional(),
  telefono: optionalPhoneField.nullable(),
  activo: z.boolean().optional(),
  cursosNuevos: z.array(teacherCourseInput).max(12).optional(),
});

export const teacherAccountSchema = z.object({
  password: z.string().min(8).max(128),
});

export const courseSchema = z.object({
  codigo: codigoField,
  nombre: z.string().min(2).max(160),
  profesorId: z.string().min(1),
  seccionId: z.string().min(1, "Seleccione grado y sección"),
  cursoCatalogoId: z.string().optional(),
  periodo: z.string().max(16).default("2026"),
});
