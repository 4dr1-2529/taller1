import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
});

export const createUserSchema = z.object({
  email: z.string().email("Correo inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
  nombres: z.string().min(2).max(120),
  apellidos: z.string().min(2).max(120),
  role: z
    .enum(["admin", "docente", "tutor", "psicologo", "estudiante", "apoderado"])
    .default("estudiante"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Mínimo 8 caracteres").max(128),
});

export const studentSchema = z.object({
  codigo: z.string().min(2).max(32),
  nombres: z.string().min(2).max(120),
  apellidos: z.string().min(2).max(120),
  seccionId: z.string().min(1, "Seleccione grado y sección"),
  dni: z.string().max(8).optional(),
  correo: z.string().email().optional().or(z.literal("")),
  telefono: z.string().max(20).optional(),
  estado: z.enum(["activo", "en_riesgo", "retirado"]).optional(),
  promedioGeneral: z.number().min(0).max(20).optional(),
  asistenciaGeneral: z.number().min(0).max(100).optional(),
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
  bimestre: z.coerce.number().int().min(1).max(4),
  nota: z.coerce.number().min(0).max(20),
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
      promedioGeneral: z.number().min(0).max(20),
      asistenciaGeneral: z.number().min(0).max(100),
      lms: z.object({
        engagement: z.enum(["alto", "medio", "bajo"]),
        actividadSemanalPct: z.array(z.number().min(0).max(100)),
        minutosPorSemana: z.array(z.number().min(0)),
        tareasEntregadas: z.number().min(0),
        tareasTotales: z.number().min(1),
        horasPlataformaSemana: z.number().min(0),
      }),
    })
    .optional(),
  estado: z.enum(["activo", "en_riesgo", "retirado"]).optional(),
});

export const chatSchema = z.object({
  roomId: z.string().min(1),
  contenido: z.string().min(1).max(2000),
});

export const psychFollowUpSchema = z.object({
  studentId: z.string().min(1),
  resumen: z.string().min(10).max(5000),
  acciones: z.string().max(5000).optional(),
  profesional: z.string().max(120).optional(),
  fecha: z.string().datetime().optional(),
});

export const alertStatusSchema = z.object({
  status: z.enum(["abierta", "en_seguimiento", "resuelta"]),
});

const teacherCourseInput = z.object({
  codigo: z.string().min(2).max(32),
  nombre: z.string().min(2).max(160),
  seccionId: z.string().optional(),
  cursoCatalogoId: z.string().optional(),
  periodo: z.string().max(16).optional(),
});

export const teacherSchema = z
  .object({
    codigo: z.string().min(2).max(32),
    nombres: z.string().min(2).max(120),
    apellidos: z.string().min(2).max(120),
    especialidad: z.string().min(2).max(120),
    correo: z.string().email().max(255),
    telefono: z.string().max(20).optional(),
    password: z.string().min(8).max(128).optional(),
    crearCuenta: z.boolean().optional(),
    cursos: z.array(teacherCourseInput).max(12).optional(),
  })
  .refine((d) => !d.crearCuenta || (d.password && d.password.length >= 8), {
    message: "Indique una contraseña de al menos 8 caracteres para la cuenta",
    path: ["password"],
  });

export const updateTeacherSchema = z.object({
  nombres: z.string().min(2).max(120).optional(),
  apellidos: z.string().min(2).max(120).optional(),
  especialidad: z.string().min(2).max(120).optional(),
  correo: z.string().email().max(255).optional(),
  telefono: z.string().max(20).optional().nullable(),
  activo: z.boolean().optional(),
  cursosNuevos: z.array(teacherCourseInput).max(12).optional(),
});

export const teacherAccountSchema = z.object({
  password: z.string().min(8).max(128),
});

export const courseSchema = z.object({
  codigo: z.string().min(2).max(32),
  nombre: z.string().min(2).max(160),
  profesorId: z.string().min(1),
  seccionId: z.string().optional(),
  cursoCatalogoId: z.string().optional(),
  periodo: z.string().max(16).default("2026"),
});
