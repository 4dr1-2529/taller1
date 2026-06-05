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
});

export const updateStudentSchema = studentSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: "Debe enviar al menos un campo para actualizar" },
);

export const enrollmentSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
});

export const matriculaSchema = z.object({
  estudianteId: z.string().min(1, "Seleccione estudiante"),
  seccionId: z.string().min(1, "Seleccione sección"),
  anioLectivoId: z.string().min(1, "Seleccione año lectivo"),
  codigo: z.string().max(30).optional(),
  fechaMatricula: z.string().optional(),
  estado: z.enum(["activa", "retirada", "trasladada"]).optional(),
});

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
  fecha: z.string().min(1),
  presente: z.boolean().default(true),
  justificado: z.boolean().default(false),
  tardanza: z.boolean().default(false),
  observacion: observacionField,
});

export const lmsMetricsSchema = z.object({
  engagement: z.enum(["alto", "medio", "bajo"]).optional(),
  actividadSemanalPct: z.array(percentageField).min(1, "Indique actividad semanal LMS"),
  minutosPorSemana: z.array(z.number().min(0)).optional(),
  tareasEntregadas: z.number().min(0, "tareas_entregadas >= 0"),
  tareasTotales: z.number().min(1, "tareas_totales >= 1"),
  horasPlataformaSemana: z.number().min(0, "tiempo_plataforma >= 0").optional(),
  frecuenciaAccesoLms: z.number().min(0).optional(),
  participacionActividades: z.number().min(0).optional(),
  usoForos: z.number().min(0).max(1).optional(),
  disminucionActividad: z.number().min(0).max(100).optional(),
});

export const predictSchema = z
  .object({
    studentId: z.string().min(1).optional(),
    metrics: z
      .object({
        promedioGeneral: gradeField,
        asistenciaGeneral: percentageField,
        lms: lmsMetricsSchema,
      })
      .optional(),
    estado: z.enum(["activo", "en_riesgo", "retirado"]).optional(),
  })
  .refine((d) => d.studentId || d.metrics, {
    message: "Indique studentId o métricas académicas/LMS completas",
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
  nombre: courseNameField,
  seccionId: z.string().min(1, "Seleccione grado y sección"),
  cursoCatalogoId: z.string().optional(),
  periodo: z.string().max(16).optional(),
});

export const teacherSchema = z
  .object({
    codigo: codigoField,
    nombres: personNameField,
    apellidos: personNameField,
    especialidad: personNameField,
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
  especialidad: personNameField.optional(),
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
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
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
